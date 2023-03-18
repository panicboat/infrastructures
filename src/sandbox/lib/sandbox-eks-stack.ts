import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

require('dotenv').config();

export class SandboxEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // cluster master role
    const masterRole = new iam.Role(this, 'cluster-master-role', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    // Create a EKS cluster with Fargate profile.
    const cluster = new eks.FargateCluster(this, 'sandbox-cluster', {
      version: eks.KubernetesVersion.V1_25,
      mastersRole: masterRole,
      clusterName: 'sandbox',
      outputClusterName: true,
      endpointAccess: eks.EndpointAccess.PUBLIC, // In Enterprise context, you may want to set it to PRIVATE.
      vpc: ec2.Vpc.fromLookup(this, 'vpc', { vpcName: 'sandbox' }),
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });
  }
}
