import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';

interface Props {
  projectName: string;
  mesh: appmesh.IMesh
  appPort: number;
}
export class MeshGateway {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  public createResources(id: string, props: Props): void {
    const gateway = new appmesh.VirtualGateway(this.scope, `VirtualGateway-${props.projectName}`, {
      mesh: props.mesh,
      virtualGatewayName: props.projectName,
      listeners: [
        appmesh.VirtualGatewayListener.http({ port: props.appPort })
      ]
    });
  }
}
