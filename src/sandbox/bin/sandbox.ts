#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as bp from './eks-blueprint';
import { SandboxStack } from '../lib/sandbox-stack';
import { config as DevProps } from '../env/develop';

const app = new cdk.App();
const environment = app.node.tryGetContext('environment');
const props = getProperties(environment);
const env: cdk.Environment = {
  account: props.account,
  region: props.region,
};
const vpc = new SandboxStack(app, 'SandboxStack', { env });
new bp.EksBuilder(app, 'EksBuilder', { env, vpc: vpc.vpc });
app.synth()

cdk.Tags.of(app).add('owner', 'panicboat');
cdk.Tags.of(app).add('environment', environment);

function getProperties(key: string) {
  switch (key) {
    case 'develop':
      return DevProps;
    default:
      throw new Error('No Support environment')
  }
}
