import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-modules/eks';
import { Construct } from 'constructs';

require('dotenv').config();

export interface Props extends cdk.StackProps {
  vpc: ec2.IVpc
}

export class SandboxEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    new eks.FargateCluster(this, 'sandbox', {
      name: 'sandbox',
      endpointAccess: cdk.aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      version: cdk.aws_eks.KubernetesVersion.V1_25,
      vpc: props.vpc
    })
  }
}
