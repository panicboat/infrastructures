import * as cdk from '@aws-cdk/core';
import { AuditResources } from 'cdk-common/audit';

export class AuditStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    require('dotenv').config();
    new AuditResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      principal: {
        primary: {
          accountId: process.env.PRIMARY_ACCOUNT_ID,
        }
      },
    });
  }
}
