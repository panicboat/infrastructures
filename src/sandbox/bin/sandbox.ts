#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SandboxStack } from '../lib/sandbox-stack';
import { DataLakeStack } from '../lib/data-lake-stack';

require('dotenv').config();
const app = new cdk.App();
const vpc = new SandboxStack(app, 'SandboxNetworkStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.CDK_DEFAULT_REGION },
});
const datalake = new DataLakeStack(app, 'DataLakeStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.CDK_DEFAULT_REGION },
});
datalake.addDependency(vpc);
app.synth();
