import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { CpuTaskOnEcs } from './interfaces';
import { Git2Ecr } from './sp_constructs/git-to-ecr';
import { Ecr2EcsTask } from './sp_constructs/ecr-to-task-def';

interface Git2EcsHttpProp extends cdk.StackProps {
  cluster: ecs.Cluster;
  task: CpuTaskOnEcs;
  githubTokenName: string;
}

export class Git2EcsHttp extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Git2EcsHttpProp) {
    super(scope, id, props);

    const ecrSource = new Git2Ecr(this, 'EcrSource', {
      githubTokenName: props.githubTokenName,
      githubRepo: props.task.githubRepo,
      githubOwner: props.task.githubOwner,
      githubBranch: props.task.githubBranch,
    });

    const taskDef = new Ecr2EcsTask(this, 'EcsTaskDef', {
      ecrRepo: ecrSource.ecrRepo,
      tag: ecrSource.tag,
      cpu: props.task.cpu,
      memoryLimitMiB: props.task.memoryLimitMiB,
      containerPort: props.task.containerPort,
    });


  }
}
