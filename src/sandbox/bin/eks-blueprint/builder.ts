import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';

interface IEksBuilder {
}
export interface Props extends cdk.StackProps {
  env: cdk.Environment
  vpc: cdk.aws_ec2.IVpc
}

export class EksBuilder implements IEksBuilder {
  public readonly stack!: cdk.Stack;

  // https://github.com/aws-quickstart/cdk-eks-blueprints/tree/main/examples
  constructor(scope: Construct, id: string, props: Props) {
    const base = blueprints.EksBlueprint.builder()
      .account(props.env.account)
      .region(props.env.region)

    const builder = () => base.clone();
  }
}
