import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { LogGroup } from '@aws-cdk/aws-logs';
import { Repository } from '@aws-cdk/aws-ecr';
import { INamespace } from '@aws-cdk/aws-servicediscovery';
import { ISecurityGroup } from '@aws-cdk/aws-ec2';
import { EcsResources } from 'cdk-common/ecs';

interface Props {
  projectName: string;
  meshName: string;
  cluster: ecs.ICluster;
  namespace: INamespace;
  appPort: number;
  securityGroups: ISecurityGroup[];
  desiredCount: number;
}
export class NodeContainerService {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  public createResources(id: string, props: Props): ecs.FargateService {
    const logGroup = new LogGroup(this.scope, `LogGroup-${props.projectName}`, {
      logGroupName: `/panicboat/${props.projectName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const repository = Repository.fromRepositoryArn(this.scope, `Repository-${props.projectName}`, `arn:aws:ecr:${this.stack.region}:${this.stack.account}:repository/colorteller`);

    const resource = new EcsResources(this.scope, id, {
      projectName: props.projectName,
      vpc: {
        subnets: props.cluster.vpc.privateSubnets,
        securityGroups: props.securityGroups,
      },
      ecs: {
        cluster: props.cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        appPorts: [props.appPort],
        virtualNodeName: `mesh/${props.meshName}/virtualNode/${props.projectName}`,
        containers: [
          {
            image: ecs.ContainerImage.fromEcrRepository(repository),
            containerName: 'app',
            essential: true,
            portMappings: [
              { containerPort: props.appPort, hostPort: props.appPort, protocol: ecs.Protocol.TCP },
            ],
            environment: {
              COLOR: props.projectName,
              SERVER_PORT: `${props.appPort}`,
              STAGE: '',
            },
            logging: ecs.LogDrivers.firelens({
              options: {
                Name: 'cloudwatch',
                region: this.stack.region,
                log_group_name: logGroup.logGroupName,
                log_stream_prefix: 'app-',
              },
            }),
          }
        ],
        logGroup: logGroup,
        namespace: props.namespace,
        role: {
          execution: { managedPolicies: [], inlinePolicies: [] },
          task: { managedPolicies: [], inlinePolicies: [] },
        },
      },
      autoScale: { minCapacity: props.desiredCount, maxCapacity: props.desiredCount },
    });

    return resource.service;
  }
}
