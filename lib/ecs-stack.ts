import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";


export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const vpc = new ec2.Vpc(this, "EcsVpc", {
        maxAzs: 3 // Default is all AZs in region
    });
  
    const cluster = new ecs.Cluster(this, "EcsCluster", {
        vpc: vpc,
    });
  
    // Create a load-balanced Fargate service and make it public
    const ecs_app = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "EcsFargateService", {
        cluster: cluster, // Required
        cpu: 2048, // Default is 256
        desiredCount: 1, // Default is 1
        taskImageOptions: { image: ecs.ContainerImage.fromAsset("sample_docker") },
        memoryLimitMiB: 4096, // Default is 512
        publicLoadBalancer: true, // Default is true
        circuitBreaker: { rollback: true },
        enableExecuteCommand: true
    });
  }
}
