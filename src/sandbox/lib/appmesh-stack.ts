import * as cdk from '@aws-cdk/core';
import { ISecurityGroup, SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';
import { Cluster } from '@aws-cdk/aws-ecs';
import { Mesh, MeshFilterType } from '@aws-cdk/aws-appmesh';
import { PrivateDnsNamespace } from '@aws-cdk/aws-servicediscovery';

export class AppMeshStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    require('dotenv').config();
    const vpcName = 'main';
    const domainName = 'sandbox.svc.cluster.local';

    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcName: vpcName });
    const cluster = new Cluster(this, 'ECSCluster', { clusterName: 'ColorApp', vpc: vpc, containerInsights: true });
    const namespace = new PrivateDnsNamespace(this, 'PrivateDnsNamespace', { name: domainName, vpc: vpc });

    const mesh = new Mesh(this, 'AppMesh', { meshName: 'ColorApp', egressFilter: MeshFilterType.ALLOW_ALL });
    let meshName = process.env.MESH_OWNER!.length === 0 ? `${mesh.meshName}` : `${mesh.meshName}@${process.env.MESH_OWNER}`;

    let securityGroups: ISecurityGroup[] = [];
    process.env.SECURITY_GROUP_ID!.split(',').forEach(securityGroupId => {
      if (securityGroupId.length !== 0) {
        securityGroups.push(SecurityGroup.fromSecurityGroupId(this, `SecurityGroup-${securityGroupId}`, securityGroupId, { mutable: false }));
      }
    });
  }
}
