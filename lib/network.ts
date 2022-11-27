import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { PrivateVpcEcsUseCase } from './sp_constructs/vpc';

export class ComputeCluster extends cdk.Stack {
  public readonly privateVpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);
    this.privateVpc = new PrivateVpcEcsUseCase(this, 'SpeechRefineVpc').vpc;
  }
}