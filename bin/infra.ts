#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { ProcessAudioStack } from '../lib/infra-stack';
import { EcsStack } from '../lib/ecs-stack';
import { SecretStack } from '../lib/secret-stack';

const app = new cdk.App();
// new ProcessAudioStack(app, 'ProcessAudioStack', {});
const secret = new SecretStack(app, 'SecretStack', {});

const ecs_cluster = new EcsStack(app, 'EcsStack', {});
