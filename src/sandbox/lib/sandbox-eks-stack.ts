import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-modules/eks';
import { Construct } from 'constructs';

require('dotenv').config();

export class SandboxEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', { vpcName: 'sandbox' });
    new eks.FargateCluster(this, 'sandbox', {
      name: 'sandbox',
      endpointAccess: cdk.aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      version: cdk.aws_eks.KubernetesVersion.V1_25,
      vpc: vpc
    })
  }
}
