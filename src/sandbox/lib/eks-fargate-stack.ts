import * as cdk from '@aws-cdk/core';
import * as cdk8s from 'cdk8s';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';

import { AwsLoadBalancerController } from './eks-fargate/aws-load-balancer-controller';
import { DashboardService } from './eks-fargate/dashboard';
import { EksAdmin } from './eks-fargate/eks-admin';

export class ElsFargateStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    require('dotenv').config();
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcName: 'main' });
    const sg = ec2.SecurityGroup.fromLookupByName(this, `SecurityGroup`, `main`, vpc);

    // cluster master role
    const masterRole = new iam.Role(this, `MasterRole`, {
      roleName: `MasterRole-${process.env.PROJECT_NAME}`,
      assumedBy: new iam.AccountRootPrincipal(),
    });

    const clusterRole = new iam.Role(this, `ClusterRole`, {
      roleName: `ClusterRole-${process.env.PROJECT_NAME}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
      ],
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
    });

    const defaultProfileRole = new iam.Role(this, `defaultProfileRole`, {
      roleName: `DefaultProfileRole-${process.env.PROJECT_NAME}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSFargatePodExecutionRolePolicy'),
      ],
      assumedBy: new iam.ServicePrincipal('eks-fargate-pods.amazonaws.com'),
    });

    // Create a EKS cluster with Fargate profile.
    const cluster = new eks.FargateCluster(this, `FargateCluster`, {
      version: eks.KubernetesVersion.V1_21,
      clusterName: process.env.PROJECT_NAME,
      clusterHandlerSecurityGroup: sg,
      defaultProfile: { selectors: [{ namespace: 'default' }, { namespace: 'kube-system' }], fargateProfileName: `default-profile`, podExecutionRole: defaultProfileRole },
      endpointAccess: eks.EndpointAccess.PRIVATE,
      mastersRole: masterRole,
      outputClusterName: true,
      outputConfigCommand: true,
      outputMastersRoleArn: true,
      placeClusterHandlerInVpc: true,
      role: clusterRole,
      securityGroup: sg,
      vpc: vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_NAT }],
    });

    // Deploy AWS LoadBalancer Controller onto EKS.
    new AwsLoadBalancerController(this, 'aws-loadbalancer-controller', {
      eksCluster: cluster,
    });

    // Create the cdk8s app.
    const cdk8sApp = new cdk8s.App();

    const admin = cluster.addCdk8sChart('admin-chart',
      new EksAdmin(cdk8sApp, 'eks-admin-chart', {})
    );

    const dashboard = cluster.addCdk8sChart('dashboard-service',
      new DashboardService(cdk8sApp, 'dashboard-chart', {})
    );

    new cdk.CfnOutput(this, 'eks-fargate-master-role-arn', {
      exportName: 'EksMasterRoleArn',
      value: masterRole.roleArn,
    });
    new cdk.CfnOutput(this, 'eks-fargate-security-group-id', {
      exportName: 'EksKubectlSecurityGroupId',
      value: sg.securityGroupId,
    });
    new cdk.CfnOutput(this, 'eks-fargate-kubectl-private-subnet-ids', {
      exportName: 'EksKubectlPrivateSubnetIds',
      value: cluster.kubectlPrivateSubnets?.map(s => s.subnetId).join(",") as string,
    });
  }

  private addProfile(projectName: string, cluster: eks.FargateCluster, podExecutionRole: iam.IRole) {
    new eks.FargateProfile(this, `FargateProfile-${projectName}`, {
      cluster: cluster,
      selectors: [{ namespace: projectName }],
      fargateProfileName: `${projectName}-profile`,
      podExecutionRole: podExecutionRole,
    });
  }
}
