#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SandboxStack } from '../lib/sandbox-stack';
import { SandboxEksStack } from '../lib/sandbox-eks-stack';

require('dotenv').config();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();
const vpc = new SandboxStack(app, 'SandboxStack', { env, });
const eks = new SandboxEksStack(app, 'SandboxEksStack', { env, vpc: vpc.vpc });
eks.addDependency(vpc);
app.synth()

cdk.Tags.of(app).add('owner', 'panicboat');
cdk.Tags.of(vpc).add('service', 'sandbox');
cdk.Tags.of(eks).add('service', 'kubernetes');
