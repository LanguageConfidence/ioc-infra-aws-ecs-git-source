#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecretStack } from '../lib/secret-stack';
import { Git2RegistryStack } from '../lib/github2registry';

const app = new cdk.App();

const secret = new SecretStack(app, 'SecretStack', {});

const cicd = new Git2RegistryStack(app, 'Git2RegistryStack', {
    gitRepo: secret.asrRepo,
    githubToken: secret.githubToken,
    githubTokenName: secret.githubTokenName,
});