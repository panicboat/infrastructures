#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SandboxStack } from '../lib/sandbox-stack';
import { SandboxEksStack } from '../lib/sandbox-eks-stack';
import { config as DevProps } from '../env/develop';

const app = new cdk.App();
const key = app.node.tryGetContext('environment');
const props = getProperties(key);
const env = {
  account: props.account,
  region: props.region,
};
const vpc = new SandboxStack(app, 'SandboxStack', { env });
const eks = new SandboxEksStack(app, 'SandboxEksStack', { env, vpc: vpc.vpc });
eks.addDependency(vpc);
app.synth()

cdk.Tags.of(app).add('owner', 'panicboat');
cdk.Tags.of(app).add('environment', 'sandbox');

function getProperties(key: string) {
  switch (key) {
    case 'develop':
      return DevProps;
    default:
      throw new Error('No Support environment')
  }
}
