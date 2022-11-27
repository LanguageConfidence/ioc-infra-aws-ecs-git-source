import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { PrivateVpcEcsUseCase } from './sp_constructs/vpc';
import * as ecs from "aws-cdk-lib/aws-ecs";

export class ComputeCluster extends cdk.Stack {
  public readonly privateVpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);
    this.privateVpc = new PrivateVpcEcsUseCase(this, 'SpeechRefineVpc').vpc;


    this.cluster = new ecs.Cluster(this, `Ml${id}`, {
      vpc: this.privateVpc,
      enableFargateCapacityProviders: true,
    });
  }
}