import * as cdk from '@aws-cdk/core';
import { ISecurityGroup, IVpc, SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';
import { Cluster, ICluster } from '@aws-cdk/aws-ecs';
import { GatewayRoute, GatewayRouteSpec, IMesh, Mesh, MeshFilterType, VirtualGateway, VirtualService } from '@aws-cdk/aws-appmesh';
import { INamespace, PrivateDnsNamespace } from '@aws-cdk/aws-servicediscovery';
import { LoadBalancerService } from './appmesh-gateway/loadbalancer';
import { GatewayContainerService } from './appmesh-gateway/ecs';
import { WebTarget } from './appmesh-gateway/web';
import { MeshGateway } from './appmesh-gateway/mesh';

export class AppMeshGatewayStack extends cdk.Stack {
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

    this.createVirtualGateway(vpc, securityGroups, cluster, namespace, mesh, meshName);
  }

  private createVirtualGateway(vpc: IVpc, securityGroups: ISecurityGroup[], cluster: ICluster, namespace: INamespace, mesh: IMesh, meshName: string) {
    const loadbalancer = new LoadBalancerService(this).createResources('ColorGateway', {
      projectName: 'color-gateway', vpc: vpc, subnets: vpc.publicSubnets, securityGroups: securityGroups
    });

    const service = new GatewayContainerService(this).createResources('GatewayContainer', {
      projectName: 'color-gateway', cluster: cluster, namespace: namespace, appPort: 9080,
      virtualNodeName: `mesh/${meshName}/virtualGateway/color-gateway`,
      subnets: vpc.privateSubnets, securityGroups: securityGroups, desiredCount: 1,
    });

    new WebTarget(this).createResources('GatewayTarget', {
      projectName: 'color-gateway', vpc: vpc, loadbalancer: loadbalancer, targets: [service], appPort: 9080
    });

    new MeshGateway(this).createResources('MeshResource', { projectName: 'color-gateway', mesh: mesh, appPort: 9080 });

    if (process.env.VIRTUAL_GATEWAY_ARN !== undefined && process.env.VIRTUAL_GATEWAY_ARN.length !== 0) {
      new GatewayRoute(this, `GatewayRoute`, {
        gatewayRouteName: 'colorteller',
        virtualGateway: VirtualGateway.fromVirtualGatewayArn(this, `VirtualGateway-colorteller`, process.env.VIRTUAL_GATEWAY_ARN),
        routeSpec: GatewayRouteSpec.http({ routeTarget: VirtualService.fromVirtualServiceAttributes(this, `VirtualService-gateway-colorteller`, { mesh: mesh, virtualServiceName: 'colorteller.sandbox.svc.cluster.local' }) }),
      });
    }
  }
}
