import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as k8s from 'aws-cdk-modules/eks';
import { Construct } from 'constructs';

export interface Props extends cdk.StackProps {
  vpc: ec2.IVpc
}

export class SandboxEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const k8sCluster = new k8s.Cluster(this, 'Cluster-Sandbox', {
      name: 'sandbox',
      endpointAccess: cdk.aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      version: cdk.aws_eks.KubernetesVersion.V1_27,
      vpc: props.vpc
    });
  }
}
