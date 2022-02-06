import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';
import { MeshResources } from 'cdk-common/appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';

interface Props {
  projectName: string;
  serviceName: string;
  domainName: string;
  mesh: appmesh.IMesh;
  appPort: number;
  nodes: {
    name: string;
    service?: IService;
    weight: number;
  }[];
}
export class MeshNode {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  public createResources(id: string, props: Props): void {
    let nodes: { name: string; service?: IService; listeners: appmesh.VirtualNodeListener[]; weight: number; backends?: string[]; }[] = [];
    props.nodes.forEach(node => {
      nodes.push({
        name: node.name,
        service: node.service,
        listeners: [
          appmesh.VirtualNodeListener.http({ port: props.appPort }),
        ],
        weight: node.weight,
      });
    });

    const resource = new MeshResources(this.scope, id, {
      projectName: props.projectName,
      serviceName: `${props.serviceName}.${props.domainName}`,
      mesh: props.mesh,
      listeners: [
        appmesh.VirtualRouterListener.http(props.appPort)
      ],
      route: {
        http: [
          { name: props.projectName, match: { path: appmesh.HttpRoutePathMatch.startsWith('/') } }
        ]
      },
      nodes: nodes,
    });
  }
}
