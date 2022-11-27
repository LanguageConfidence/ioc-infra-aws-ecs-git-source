import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import { CpuTaskOnEcs } from './interfaces';
import { Git2Ecr } from './sp_constructs/git-to-ecr';
import { Ecr2EcsTask } from './sp_constructs/ecr-to-task-def';
import { TaskDef2EcsHttp } from './sp_constructs/task-def-to-ecs-http';

interface Git2EcsHttpProp extends cdk.StackProps {
  cluster: ecs.Cluster;
  task: CpuTaskOnEcs;
  githubTokenName: string;
  isFirstDeploy: boolean;
}

export class Git2EcsHttp extends cdk.Stack {
  public readonly url: string | undefined;

  constructor(scope: Construct, id: string, props: Git2EcsHttpProp) {
    super(scope, id, props);

    const ecrSource = new Git2Ecr(this, 'EcrSource', {
      githubTokenName: props.githubTokenName,
      githubRepo: props.task.githubRepo,
      githubOwner: props.task.githubOwner,
      githubBranch: props.task.githubBranch,
    });
    if(!props.isFirstDeploy) {
     
      const taskDef = new Ecr2EcsTask(this, 'EcsTaskDef', {
        ecrRepo: ecrSource.ecrRepo,
        tag: ecrSource.tag,
        cpu: props.task.cpu,
        memoryLimitMiB: props.task.memoryLimitMiB,
        containerPort: props.task.containerPort,
      });

      const taskDef2EcsHttp = new TaskDef2EcsHttp(this, 'TaskDef2EcsHttp', {
        cluster: props.cluster,
        taskDefinition: taskDef.taskDefinition,
        containerPort: props.task.containerPort,
      });
      this.url = taskDef2EcsHttp.url;
    }
  }
}
