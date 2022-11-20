import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class SecretStack extends cdk.Stack {
  // Note this stack only create place holder for github token
  // The actual token is created in the console
  // You can use the following command to set the token
  // aws  secretsmanager put-secret-value --secret-id secret_arn --secret-string github_token

  public readonly githubTokenName: string;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubSecret = new secretsmanager.Secret(this, 'githubSecret')
    this.githubTokenName = githubSecret.secretName;

    new cdk.CfnOutput(this, 'GithubTokenName', {
      value: this.githubTokenName,
    });
  }
}