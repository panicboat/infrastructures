import * as cdk from '@aws-cdk/core';
import { VpcResources } from 'cdk-common/vpc';

export class SandboxStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    require('dotenv').config();
    new VpcResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      cidrBlock: process.env.VPC_CIDR_BLOCK!,
      endpoints: [
        // { serviceName: 'ssm', privateDnsEnabled: true },
        // { serviceName: 'ssmmessages', privateDnsEnabled: true },
        // { serviceName: 'ec2messages', privateDnsEnabled: true },
        { serviceName: 'ecr.dkr', privateDnsEnabled: true },
        { serviceName: 'ecr.api', privateDnsEnabled: true },
      ],
    });
  }
}
