import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

interface TaskDef2EcsHttpProps{
  ecrRepo: ecr.Repository;
  tag: string;
  cpu: number;
  memoryLimitMiB: number;
  containerPort: number;
}  

export class TaskDef2EcsHttp extends Construct {
  public readonly url: string | undefined;

  constructor(scope: Construct, id: string, props: TaskDef2EcsHttpProps) {
    super(scope, id);
  }
}