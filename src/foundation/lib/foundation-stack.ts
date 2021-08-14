import * as cdk from '@aws-cdk/core';
import { NetworkResources } from 'cdk-common/network';

export class FoundationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    require('dotenv').config();
    new NetworkResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock: process.env.VpcCidrBlock!,
      isFoundation: true,
      principal: {
        accountIds: [
          // set step1
          process.env.PlatformAccountID!,
        ],
        vpcCidrBlock: [
          // set step1
          process.env.PlatformVpcCidrBlock!,
        ],
        tgwAttachmentIds: [
          // set step3
          process.env.PlatformTGWAttachmentID!
        ],
      },
      isReadyTGW: false,
    });
  }
}
