import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class ApigwLambdaMiddleware extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello_fn = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      handler: 'hello.handler',
      timeout: cdk.Duration.seconds(30),
    });

    const gwLambdaIg = new HttpLambdaIntegration('BooksIntegration', hello_fn);
    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi');

    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: gwLambdaIg,
    }); 

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.apiEndpoint,
    });
  }
}
