import * as cdk from '@aws-cdk/core';
import { VpcResources } from 'cdk-common/vpc';

export class FoundationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    require('dotenv').config();
    new VpcResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock: process.env.VpcCidrBlock!,
      principal: {
        accountIds: [
          // Step1 : Add aws account id
          // process.env.SandboxAccountID!,
          // process.env.PlatformAccountID!,
        ],
        vpcCidrBlock: [
          // Step1 : Add vpc cidr block
          // process.env.SandboxVpcCidrBlock!,
          // process.env.PlatformVpcCidrBlock!,
        ],
        tgwAttachmentIds: [
          // Step3 : Add tgw attachement id
          // process.env.SandboxTGWAttachmentID!,
          // process.env.PlatformTGWAttachmentID!,
        ],
      },
      endpoints: [
        // { serviceName: 'ssm', privateDnsEnabled: true },
        // { serviceName: 'ssmmessages', privateDnsEnabled: true },
        // { serviceName: 'ec2messages', privateDnsEnabled: true },
      ],
    });
  }
}
