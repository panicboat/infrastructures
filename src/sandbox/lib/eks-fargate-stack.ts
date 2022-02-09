import * as cdk from '@aws-cdk/core';
import * as cdk8s from 'cdk8s';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';

import { AwsLoadBalancerController } from './eks-fargate/aws-loadbalancer-controller';
import { NginxService } from './eks-fargate/nginx-service';
import { EksFargateLogging } from './eks-fargate/eks-fargate-logging'

export class CdkEksFargateStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcName: 'main' });
        const sg = ec2.SecurityGroup.fromLookupByName(this, `SecurityGroup`, `main`, vpc);

        // cluster master role
        const masterRole = new iam.Role(this, `MasterRole`, {
            roleName: `${process.env.PROJECT_NAME}MasterRole`,
            assumedBy: new iam.AccountRootPrincipal(),
        });

        const clusterRole = new iam.Role(this, `ClusterRole`, {
            roleName: `${process.env.PROJECT_NAME}ClusterRole`,
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
            ],
            assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
        });

        const defaultProfileRole = new iam.Role(this, `defaultProfileRole`, {
            roleName: `${process.env.PROJECT_NAME}DefaultProfileRole`,
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
            defaultProfile: { selectors: [ { namespace: 'default' }, { namespace: 'kube-system' } ], fargateProfileName: `default-profile`, podExecutionRole: defaultProfileRole },
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

        // Now we add the cdk8s chart for the actual application workload, here we take the nginx deployment & service as example.
        //
        // First we create an IAM role, which will be associated with the K8S service account for the actual k8s app. Then we
        // can grant permission to that IAM role so that the actual K8S app can access AWS resources as required.
        //
        // Please note the nginx app itself does not really need any access to AWS resources, however we still include the codes of
        // setting up IAM role and K8S service account so you can reuse them in your own use case where the K8S app does need to access
        // AWS resources, such as s3 buckets.
        //
        const k8sAppNameSpace = 'nginx';
        const k8sIngressName = 'api-ingress';
        const k8sAppServiceAccount = 'sa-nginx';
        const conditions = new cdk.CfnJson(this, 'ConditionJson', {
            value: {
                [`${cluster.clusterOpenIdConnectIssuer}:aud`]: 'sts.amazonaws.com',
                [`${cluster.clusterOpenIdConnectIssuer}:sub`]: `system:serviceaccount:${k8sAppNameSpace}:${k8sAppServiceAccount}`,
            },
        });

        const iamPrinciple = new iam.FederatedPrincipal(
            cluster.openIdConnectProvider.openIdConnectProviderArn,
            {},
            'sts:AssumeRoleWithWebIdentity'
        ).withConditions({
            StringEquals: conditions,
        });
        const iamRoleForK8sSa = new iam.Role(this, 'nginx-app-sa-role', {
            assumedBy: iamPrinciple,
        });

        // Grant the IAM role S3 permission as an example to show how you can assign Fargate Pod permissions to access AWS resources
        // even though nginx Pod itself does not need to access AWS resources, such as S3.
        const example_s3_bucket = new s3.Bucket(
            this,
            'S3BucketToShowGrantPermission',
            {
                encryption: s3.BucketEncryption.KMS_MANAGED,
            }
        );
        example_s3_bucket.grantRead(iamRoleForK8sSa);

        // Apart from the permission to access the S3 bucket above, you can also grant permissions of other AWS resources created in this CDK app to such AWS IAM role.
        // Then in the follow-up CDK8S Chart, we will create a K8S Service Account to associate with this AWS IAM role and a nginx K8S deployment to use the K8S SA.
        // As a result, the nginx Pod will have the fine-tuned AWS permissions defined in this AWS IAM role.

        // Now create a Fargate Profile to host customer app which hosting Pods belonging to nginx namespace.
        const customerAppFargateProfile = cluster.addFargateProfile(
            'customer-app-profile',
            {
                selectors: [{ namespace: k8sAppNameSpace }],
                subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
                vpc: cluster.vpc,
            }
        );

        const loggingIamPolicy = new iam.ManagedPolicy(this, 'eks-fargate-logging-iam-policy', {
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'logs:CreateLogStream',
                    'logs:CreateLogGroup',
                    'logs:DescribeLogStreams',
                    'logs:PutLogEvents'
                ],
                resources: ['*'],
              }),
            ],
        });
        customerAppFargateProfile.podExecutionRole.addManagedPolicy(loggingIamPolicy);

        const loggingChart = cluster.addCdk8sChart(
            'eks-fargate-logging',
            new EksFargateLogging(cdk8sApp, 'eks-fargate-logging-chart')
        );

        loggingChart.node.addDependency(customerAppFargateProfile);

        const k8sAppChart = cluster.addCdk8sChart(
            'nginx-app-service',
            new NginxService(cdk8sApp, 'nginx-app-chart', {
                iamRoleForK8sSaArn: iamRoleForK8sSa.roleArn,
                nameSpace: k8sAppNameSpace,
                ingressName: k8sIngressName,
                serviceAccountName: k8sAppServiceAccount,
            })
        );

        k8sAppChart.node.addDependency(customerAppFargateProfile);
    }
}
