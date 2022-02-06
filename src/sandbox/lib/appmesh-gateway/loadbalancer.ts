import * as cdk from '@aws-cdk/core';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { ISecurityGroup, ISubnet, IVpc } from '@aws-cdk/aws-ec2';

interface Props {
  projectName: string;
  vpc: IVpc;
  subnets: ISubnet[];
  securityGroups: ISecurityGroup[];
}
export class LoadBalancerService {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  public createResources(id: string, props: Props): elbv2.NetworkLoadBalancer {
    return new elbv2.NetworkLoadBalancer(this.scope, `NetworkLoadBalancer-${props.projectName}`, {
      loadBalancerName: props.projectName,
      vpc: props.vpc,
      vpcSubnets: {
        subnets: props.subnets,
      },
      crossZoneEnabled: true,
      internetFacing: true,
    });
  }
}
