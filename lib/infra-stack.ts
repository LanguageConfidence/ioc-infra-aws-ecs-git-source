import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ProcessAudioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'S3TriggerAudioProcess', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'read_audio.handler',
      code: lambda.Code.fromAsset("lambda"),
    });

    // const fn = new lambda.Function(this, 'S3TriggerAudioProcess', {
    //   runtime: lambda.Runtime.PYTHON_3_8,
    //   handler: 'read_audio.handler',
    //   code: lambda.Code.fromAsset("lambda"),
    // });

    const audiobucket = new s3.Bucket(this, 'MyAudioBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    fn.addEventSource(new S3EventSource(audiobucket, {
      events: [ s3.EventType.OBJECT_CREATED],
    }));
    

    const s3ReadBucket = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${audiobucket.bucketArn}/*`],
      effect: iam.Effect.ALLOW
    });

    fn.role?.attachInlinePolicy(
      new iam.Policy(this, 'read-buckets-policy', {
        statements: [s3ReadBucket],
      }),
    );
  }
}