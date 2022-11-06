#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { ProcessAudioStack } from '../lib/infra-stack';
import { EcsStack } from '../lib/ecs-stack';
import { SecretStack } from '../lib/secret-stack';
import { CiCdGit2EcsStack } from '../lib/cicd-repo-to-ecs';

const app = new cdk.App();

const secret = new SecretStack(app, 'SecretStack', {});

const ecs_cluster = new EcsStack(app, 'EcsStack', {});

const cicd = new CiCdGit2EcsStack(app, 'CiCdGit2EcsStack', {
    gitRepo: secret.asrRepo,
    githubToken: secret.githubToken,
    cluster: ecs_cluster.myCluster,
});