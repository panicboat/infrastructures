import * as cdk from '@aws-cdk/core';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { IVpc } from '@aws-cdk/aws-ec2';

interface Props {
  projectName: string;
  vpc: IVpc;
  loadbalancer: elbv2.NetworkLoadBalancer;
  targets: elbv2.INetworkLoadBalancerTarget[];
  appPort: number;
}
export class WebTarget {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  public createResources(id: string, props: Props): void {
    const targetGroup = new elbv2.NetworkTargetGroup(this.scope, `NetworkTargetGroup-${props.projectName}`, {
      targetGroupName: props.projectName,
      targetType: elbv2.TargetType.IP,
      targets: props.targets,
      healthCheck: {
        enabled: true,
        healthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
        port: props.appPort.toString(),
        protocol: elbv2.Protocol.TCP,
        timeout: cdk.Duration.seconds(10),
        unhealthyThresholdCount: 3,
      },
      vpc: props.vpc,
      port: props.appPort,
      protocol: elbv2.Protocol.TCP,
      deregistrationDelay: cdk.Duration.seconds(120),
    });

    const listener = props.loadbalancer.addListener(`ApplicationListener-${props.projectName}`, {
      port: 80,
      protocol: elbv2.Protocol.TCP,
      defaultAction: elbv2.NetworkListenerAction.forward([targetGroup]),
    });
  }
}
