#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecretStack } from '../lib/secret-stack';
import { Git2RegistryStack } from '../lib/github2registry';
import { EcsStack } from '../lib/ecs-stack';

const app = new cdk.App();

const secret = new SecretStack(app, 'SecretStack', {});

const cicd = new Git2RegistryStack(app, 'Git2RegistryStack', {
    githubTokenName: secret.githubTokenName,
});

const cluster = new EcsStack(app, 'EcsStack', {
    ecrRepo: cicd.ecrRepo,
    tag: cicd.tag,
});
