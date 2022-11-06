import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { GithubRepo } from './config';
import { SecretValue } from "aws-cdk-lib";

export class SecretStack extends cdk.Stack {
    // Note this stack only create place holder for github token
    // The actual token is created in the console
    // You can use the following command to set the token
    // aws  secretsmanager put-secret-value --secret-id secret_arn --secret-string github_token

    public readonly asrRepo: GithubRepo;
    public readonly githubToken: SecretValue;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const githubSecret = new secretsmanager.Secret(this, 'githubSecret')
        this.githubToken = secretsmanager.Secret.fromSecretNameV2(
            this, 'githubToken', githubSecret.secretName).secretValue;

        this.asrRepo = {
            githubOwner: 'egochao',
            githubRepo: 'whisper_torchserve',
            githubProdBranch: 'main',
            githubDevBranch: 'develop',
        }
        new cdk.CfnOutput(this, 'GithubTokenArn', {
            value: githubSecret.secretArn,
        });
    }
}