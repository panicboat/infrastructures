import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpc from 'aws-cdk-modules/vpc';
import { Construct } from 'constructs';

export interface Props extends cdk.StackProps {
}

export class SandboxStack extends cdk.Stack {
  public readonly vpc!: ec2.IVpc;

  constructor(scope: Construct, id: string, props?: Props) {
    super(scope, id, props);
    const resource = new vpc.Vpc(this, 'Sandbox', {
      availabilityZones: cdk.Stack.of(this).availabilityZones.sort().slice(0, 2),
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    this.vpc = resource.vpc;
  }
}
