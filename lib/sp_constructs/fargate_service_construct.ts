import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';
import { FargateService } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';


export interface FargateProps {
    cluster: ecs.Cluster;
    cpu: number;
    memoryLimitMiB: number;
    desiredCount: number;
    maxCapacity: number;
    scaleOnCpuUtilizationPer: number;
    listenPort: number;
}
  
export class BaseFargateSv extends Construct {
    readonly service: FargateService;
    readonly loadBalancer: ApplicationLoadBalancer;
    constructor(scope: Construct, id: string, props: FargateProps) {
      super(scope, id);
      
      const taskrole = new iam.Role(this, `ecs-taskrole-${id}`, {
        roleName: `ecs-taskrole-${id}`,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
      });
  
      const executionRolePolicy =  new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
                  "ecr:getauthorizationtoken",
                  "ecr:batchchecklayeravailability",
                  "ecr:getdownloadurlforlayer",
                  "ecr:batchgetimage",
                  "logs:createlogstream",
                  "logs:putlogevents"
              ]
      });

      const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef", {
        taskRole: taskrole
      });

      taskDef.addToExecutionRolePolicy(executionRolePolicy);

      const baseImage = 'public.ecr.aws/amazonlinux/amazonlinux:2022'
        const container = taskDef.addContainer('flask-app', {
        image: ecs.ContainerImage.fromRegistry(baseImage),
        memoryLimitMiB: props.memoryLimitMiB,
        cpu: props.cpu,
      });

      container.addPortMappings({
        containerPort: 5000,
        protocol: ecs.Protocol.TCP
      });

      const fargateWithLoad = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "ecs-service", {
        cluster: props.cluster,
        taskDefinition: taskDef,
        publicLoadBalancer: true,
        desiredCount: props.desiredCount,
        listenerPort: props.listenPort,
      });
    
      const scaling = fargateWithLoad.service.autoScaleTaskCount({ maxCapacity: props.maxCapacity });
      scaling.scaleOnCpuUtilization('cpuscaling', {
        targetUtilizationPercent: props.scaleOnCpuUtilizationPer,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60)
      });
      
      this.service = fargateWithLoad.service;
      this.loadBalancer = fargateWithLoad.loadBalancer;

    }
}
  