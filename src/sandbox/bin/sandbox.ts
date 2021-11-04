#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SandboxStack } from '../lib/sandbox-stack';

require('dotenv').config();
const app = new cdk.App();
new SandboxStack(app, 'SandboxNetworkStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.CDK_DEFAULT_REGION },
});
app.synth();
