import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { EcrDockerCredentialOptions } from 'aws-cdk-lib/pipelines';
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
    
    this.myCluster = new ecs.Cluster(this, `${clusterName}`, {});

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
    });
    
    ecs_sv.targetGroup.configureHealthCheck({
      path: "/ping",
    });
    
    new cdk.CfnOutput(this, 'Url', {
      value: ecs_sv.loadBalancer.loadBalancerDnsName,
    });
  }
}
