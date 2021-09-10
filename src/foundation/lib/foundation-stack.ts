import * as cdk from '@aws-cdk/core';
import { VpcResources } from 'cdk-common/vpc';

export class FoundationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    require('dotenv').config();
    new VpcResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      cidrBlock: process.env.VPC_CIDR_BLOCK!,
      principal: {
        accountIds: [
          // Step1 : Add aws account id
          // process.env.SANDBOX_ACCOUNT_ID!,
          // process.env.PLATFORM_ACCOUNT_ID!,
        ],
        vpcCidrBlock: [
          // Step1 : Add vpc cidr block
          // process.env.SANDBOX_VPC_CIDR_BLOCK!,
          // process.env.PLATFORM_VPC_CIDR_BLOCK!,
        ],
        tgwAttachmentIds: [
          // Step3 : Add tgw attachement id
          // process.env.SANDBOX_TGW_ATTACH_ID!,
          // process.env.PLATFORM_TGW_ATTACH_ID!,
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
