import * as cdk from '@aws-cdk/core';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { ISecurityGroup, IVpc, ISubnet, Peer, Port, SecurityGroup } from '@aws-cdk/aws-ec2';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';

interface Props {
  projectName: string;
  acmCertificate: ICertificate;
  vpc: IVpc;
  securityGroups: ISecurityGroup[];
  internetFacing: boolean;
}
export class LoadBalancerService {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  public createResources(id: string, props: Props) {
    const securityGroup = new SecurityGroup(this.scope, `SecurityGroup4ALB-${props.projectName}`, {
      vpc: props.vpc,
      securityGroupName: 'allow-from-web',
      disableInlineRules: true,
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.allTraffic());

    const alb = new elbv2.ApplicationLoadBalancer(this.scope, `ApplicationLoadBalancer-${props.projectName}`, {
      loadBalancerName: props.projectName,
      vpc: props.vpc,
      vpcSubnets: {
        subnets: props.internetFacing ? props.vpc.publicSubnets : props.vpc.privateSubnets,
      },
      internetFacing: props.internetFacing,
      securityGroup: securityGroup,
    });
    props.securityGroups.forEach(sg => {
      alb.addSecurityGroup(sg);
    });

    new elbv2.ApplicationListener(this.scope, `ApplicationListener-${props.projectName}-80`, {
      loadBalancer: alb,
      defaultAction: elbv2.ListenerAction.redirect({ protocol: elbv2.ApplicationProtocol.HTTPS, port: '443' }),
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });
    const listener = new elbv2.ApplicationListener(this.scope, `ApplicationListener-${props.projectName}-443`, {
      loadBalancer: alb,
      certificates: [elbv2.ListenerCertificate.fromCertificateManager(props.acmCertificate)],
      defaultAction: elbv2.ListenerAction.fixedResponse(404),
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });
    return { alb: alb, listener: { ssl: listener } };
  }
}
