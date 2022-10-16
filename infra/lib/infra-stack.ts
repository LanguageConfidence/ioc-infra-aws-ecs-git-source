import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'S3TriggerAudioProcess', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("lambda"),
    });

    const bucket = new s3.Bucket(this, 'MyAudioBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    fn.addEventSource(new S3EventSource(bucket, {
      events: [ s3.EventType.OBJECT_CREATED],
      // filters: [ { prefix: 'subdir/' } ], // optional
    }));
    

    const s3ReadBucket = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::*'],
      effect: iam.Effect.ALLOW
    });

    fn.role?.attachInlinePolicy(
      new iam.Policy(this, 'read-buckets-policy', {
        statements: [s3ReadBucket],
      }),
    );
  }
}
