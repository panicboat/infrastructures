import * as cdk from '@aws-cdk/core';
import { ISecurityGroup, SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';
import { Cluster, ICluster } from '@aws-cdk/aws-ecs';
import { IMesh, Mesh, MeshFilterType } from '@aws-cdk/aws-appmesh';
import { INamespace, PrivateDnsNamespace } from '@aws-cdk/aws-servicediscovery';
import { NodeContainerService } from './appmesh-services/ecs';
import { MeshNode } from './appmesh-services/mesh';

export class AppMeshStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    require('dotenv').config();
    const vpcName = 'main';
    const domainName = 'sandbox.svc.cluster.local';

    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcName: vpcName });
    const cluster = Cluster.fromClusterAttributes(this, 'ECSCluster', { clusterName: 'ColorApp', vpc: vpc, securityGroups: [] });
    const namespace = PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(this, 'PrivateDnsNamespace', { namespaceName: domainName, namespaceId: '', namespaceArn: '' });

    const mesh = Mesh.fromMeshArn(this, 'Mesh', process.env.MESH_ARN!);
    let meshName = process.env.MESH_OWNER!.length === 0 ? `${mesh.meshName}` : `${mesh.meshName}@${process.env.MESH_OWNER}`;

    let securityGroups: ISecurityGroup[] = [];
    process.env.SECURITY_GROUP_ID!.split(',').forEach(securityGroupId => {
      if (securityGroupId.length !== 0) {
        securityGroups.push(SecurityGroup.fromSecurityGroupId(this, `SecurityGroup-${securityGroupId}`, securityGroupId, { mutable: false }));
      }
    });

    this.createVirtualService(meshName, cluster, namespace, securityGroups, domainName, mesh);
  }

  private createVirtualService(meshName: string, cluster: ICluster, namespace: INamespace, securityGroups: ISecurityGroup[], domainName: string, mesh: IMesh) {
    const black = new NodeContainerService(this).createResources('ColorTellerBlack', {
      projectName: 'colorteller-black', meshName: meshName, cluster: cluster, namespace: namespace, appPort: 9080, securityGroups: securityGroups, desiredCount: 0,
    });
    const blue  = new NodeContainerService(this).createResources('ColorTellerBlue', {
      projectName: 'colorteller-blue', meshName: meshName, cluster: cluster, namespace: namespace, appPort: 9080, securityGroups: securityGroups, desiredCount: 0,
    });
    const red   = new NodeContainerService(this).createResources('ColorTellerRed', {
      projectName: 'colorteller-red', meshName: meshName, cluster: cluster, namespace: namespace, appPort: 9080, securityGroups: securityGroups, desiredCount: 0,
    });
    const white = new NodeContainerService(this).createResources('ColorTellerWhite', {
      projectName: 'colorteller-white', meshName: meshName, cluster: cluster, namespace: namespace, appPort: 9080, securityGroups: securityGroups, desiredCount: 0,
    });

    new MeshNode(this).createResources('MeshResources', {
      projectName: 'ColorApp', serviceName: 'colorteller', domainName: domainName, mesh: mesh, appPort: 9080,
      nodes: [
        { name: 'colorteller-black', service: black.cloudMapService, weight: 1, },
        { name: 'colorteller-white', service: white.cloudMapService, weight: 1, },
        { name: 'colorteller-blue', service: blue.cloudMapService, weight: 1, },
        { name: 'colorteller-red', service: red.cloudMapService, weight: 1, },
      ],
    });
  }
}
