import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as vpc from 'aws-cdk-modules/vpc';

require('dotenv').config();

export class SandboxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new vpc.Vpc(this, id, {
      subnetConfiguration: [
        {
          name: 'Public1',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          name: 'Public2',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          name: 'Private1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        {
          name: 'Private2',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        {
          name: 'Isolated1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        {
          name: 'Isolated2',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
      ]
    })
  }
}
