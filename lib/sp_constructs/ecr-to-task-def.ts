import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from "aws-cdk-lib/aws-ecs";

interface Ecr2EcsTaskProps{
  ecrRepo: ecr.Repository;
  tag: string;
  cpu: number;
  memoryLimitMiB: number;
  containerPort: number;
}  

export class Ecr2EcsTask extends Construct {
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: Ecr2EcsTaskProps) {
    super(scope, id);
    const taskName = "MlCluster";
    const containerPort = props.containerPort;

    this.taskDefinition = new ecs.FargateTaskDefinition(this, `${id}-taskdef`, {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
    });

    const container = this.taskDefinition.addContainer(`${id}-container`, {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepo, props.tag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${id}-container`,
      }),
    });

    container.addPortMappings({ containerPort: containerPort });
  }
}