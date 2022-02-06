import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { LogGroup } from '@aws-cdk/aws-logs';
import { ISecurityGroup, ISubnet } from '@aws-cdk/aws-ec2';
import { INamespace } from '@aws-cdk/aws-servicediscovery';
import { CompositePrincipal, Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';


interface Props {
  projectName: string;
  cluster: ecs.ICluster;
  namespace: INamespace;
  appPort: number;
  virtualNodeName: string;
  subnets: ISubnet[];
  securityGroups: ISecurityGroup[];
  desiredCount: number;
}
export class GatewayContainerService {
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

    const execRole = new Role(this.scope, `EcsTaskExecutionRole-${props.projectName}`, {
      roleName: `EcsTaskExecutionRole-${props.projectName}`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const taskRole = new Role(this.scope, `EcsTaskRole-${props.projectName}`, {
      roleName: `EcsTaskRole-${props.projectName}`,
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('ecs-tasks.amazonaws.com'),
        new ServicePrincipal('events.amazonaws.com'),
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceEventsRole'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this.scope, `TaskDefinition-${props.projectName}`, {
      family: props.projectName,
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: taskRole,
      executionRole: execRole,
    });
    taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.19.1.0-prod'),
      containerName: 'app',
      user: '1337',
      essential: true,
      portMappings: [
        { containerPort: props.appPort, hostPort: props.appPort, protocol: ecs.Protocol.TCP },
        { containerPort: 9901, hostPort: 9901, protocol: ecs.Protocol.TCP },
      ],
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: props.virtualNodeName,
        ENABLE_ENVOY_STATS_TAGS: '1',
        ENABLE_ENVOY_DOG_STATSD: '1',
        STATSD_PORT: '8125',
      },
      logging: ecs.LogDrivers.firelens({
        options: {
          Name: 'cloudwatch',
          region: this.stack.region,
          log_group_name: logGroup.logGroupName,
          log_stream_prefix: 'app-',
        },
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE'],
        interval: cdk.Duration.seconds(5),
        timeout: cdk.Duration.seconds(2),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });
    taskDefinition.addContainer('cloudwatch', {
      image: ecs.ContainerImage.fromRegistry('amazon/cloudwatch-agent:latest'),
      essential: true,
      portMappings: [
        { containerPort: 8125, hostPort: 8125, protocol: ecs.Protocol.UDP },
      ],
      environment: {
        CW_CONFIG_CONTENT: `{ "metrics": { "namespace":"${props.projectName}-envoy/StatsD", "metrics_collected": { "statsd": { "metrics_aggregation_interval": 0}}}}`
      },
      logging: ecs.LogDrivers.firelens({
        options: {
          Name: 'cloudwatch',
          region: this.stack.region,
          log_group_name: logGroup.logGroupName,
          log_stream_prefix: 'cw-',
        },
      }),
    });
    taskDefinition.addFirelensLogRouter('fluent-bit', {
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
      },
      image: ecs.ContainerImage.fromRegistry('amazon/aws-for-fluent-bit:latest')
    });

    const service = new ecs.FargateService(this.scope, `Service-${props.projectName}`, {
      cluster: props.cluster,
      taskDefinition: taskDefinition,
      circuitBreaker: {
        rollback: true
      },
      cloudMapOptions: {
        name: props.projectName,
        cloudMapNamespace: props.namespace,
        dnsTtl: cdk.Duration.seconds(0),
      },
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS
      },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      desiredCount: props.desiredCount,
      enableECSManagedTags: true,
      enableExecuteCommand: true,
      securityGroups: props.securityGroups,
      serviceName: props.projectName,
      vpcSubnets: {
        subnets: props.subnets,
      },
    });

    return service
  }
}
