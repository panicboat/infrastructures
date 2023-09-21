import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface IEksBuilder {
}
export interface Props extends cdk.StackProps {
  vpc: cdk.aws_ec2.IVpc
}

export class EksBuilder implements IEksBuilder {
  // https://github.com/aws-quickstart/cdk-eks-blueprints/tree/main/examples
  constructor(scope: Construct, id: string, props: Props) {
  }
}
