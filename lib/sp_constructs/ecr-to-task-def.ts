import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

interface EcsTaskDefProps{
  ecrRepo: ecr.Repository;
  tag: string;
  cpu: number;
  memoryLimitMiB: number;
  containerPort: number;
}  

export class EcsTaskDef extends Construct {
  public readonly url: string | undefined;

  constructor(scope: Construct, id: string, props: EcsTaskDefProps) {
    super(scope, id);
    const taskName = "MlCluster";
    const containerPort = props.containerPort;

    const taskDefinition = new ecs.FargateTaskDefinition(this, `${id}-taskdef`, {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
    });

    const container = taskDefinition.addContainer(`${id}-container`, {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepo, props.tag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${id}-container`,
      }),
    });

    container.addPortMappings({ containerPort: containerPort });
}}