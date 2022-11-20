import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from 'aws-cdk-lib/aws-ecr';

interface EcsClusterProps extends cdk.StackProps {
  ecrRepo: ecr.Repository;
  tag: string;
}

export class EcsStack extends cdk.Stack {

  public readonly myCluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterProps) {
    super(scope, id, props);
    const clusterName = "MlCluster";
    
    this.myCluster = new ecs.Cluster(this, `${clusterName}`, {
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    const ecs_sv = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${clusterName}SV`, {
      cluster: this.myCluster,
      memoryLimitMiB: 8192,
      desiredCount: 1,
      cpu: 2048,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(props.ecrRepo, props.tag),
        containerPort: 8888,
      },
      loadBalancerName: `${clusterName}LB`,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 0,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
    });
    
    ecs_sv.targetGroup.configureHealthCheck({
      path: "/ping",
    });
    
    const scalableTarget = ecs_sv.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 5,
    });
    
    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 80,
    });
    
    // scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
    //   targetUtilizationPercent: 50,
    // });
    
    new cdk.CfnOutput(this, 'Url', {
      value: ecs_sv.loadBalancer.loadBalancerDnsName,
    });
  }
}
