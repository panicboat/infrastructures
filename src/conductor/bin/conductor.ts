#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ConductorStack } from '../lib/conductor-stack';
import { AuditStack } from '../lib/audit-stack';

require('dotenv').config();
const app = new cdk.App();
new AuditStack(app, 'SandboxAuditStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.CDK_DEFAULT_REGION },
});
new ConductorStack(app, 'ConductorStack', {
  env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.CDK_DEFAULT_REGION },
});
app.synth();
