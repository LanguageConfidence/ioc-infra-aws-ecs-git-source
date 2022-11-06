import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";


export class EcsStack extends cdk.Stack {

  public readonly myCluster: ecs.Cluster;
  public readonly myVpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.myVpc = new ec2.Vpc(this, "EcsVpc", {
        maxAzs: 3 // Default is all AZs in region
    });
  
    this.myCluster = new ecs.Cluster(this, "EcsCluster", {
        vpc: this.myVpc,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
        value: this.myCluster.clusterName,
    });
    new cdk.CfnOutput(this, 'VpcId', {
        value: this.myVpc.vpcId,
    });
    
  }
}
