import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";


export class EcsStack extends cdk.Stack {

  public readonly myCluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  
    this.myCluster = new ecs.Cluster(this, "EcsCluster", {});

    new cdk.CfnOutput(this, 'ClusterName', {
        value: this.myCluster.clusterName,
    });    
  }
}
