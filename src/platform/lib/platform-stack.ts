import * as cdk from '@aws-cdk/core';
import { NetworkResources } from 'cdk-common/network';

export class PlatformStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    require('dotenv').config();
    new NetworkResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock : process.env.VpcCidrBlock!,
    });
  }
}
