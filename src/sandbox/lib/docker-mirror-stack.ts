import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets'
import { LoadBalancerService } from './docker-mirror/loadbalancer';

export class DockerHubMirrorStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    require('dotenv').config()
    const vpcName = 'main';
    const projectName = 'docker-mirror';

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, `HostedZone-${projectName}`, {
      hostedZoneId: process.env.HOSTED_ZONE_ID!,
      zoneName: process.env.HOSTED_ZONE_NAME!
    });

    const acmCertificate = new acm.Certificate(this, `DnsValidatedCertificate-${projectName}`, {
      domainName: `${process.env.DOMAIN_NAME!}.${hostedZone.zoneName}`,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const vpc = ec2.Vpc.fromLookup(this, `Vpc-${projectName}`, { vpcName: vpcName });
    let securityGroups: ec2.ISecurityGroup[] = [];
    process.env.SECURITY_GROUP_ID!.split(',').forEach(securityGroupId => {
      if (securityGroupId.length !== 0) {
        securityGroups.push(ec2.SecurityGroup.fromSecurityGroupId(this, `SecurityGroup-${securityGroupId}`, securityGroupId, { mutable: false }));
      }
    });
    const alb = new LoadBalancerService(this).createResources(`LoadBalancerService-${projectName}`, {
      acmCertificate: acmCertificate,
      projectName: projectName,
      vpc: vpc,
      securityGroups: securityGroups,
      internetFacing: true,
    });

    const record = new route53.ARecord(this, `ARecord-${projectName}`, {
      zone: hostedZone,
      recordName: `${process.env.DOMAIN_NAME!}.${hostedZone.zoneName}`,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb.alb)),
    });
  }
}
