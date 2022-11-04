#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProcessAudioStack } from '../lib/infra-stack';
import { EcsStack } from '../lib/ecs-stack';

const app = new cdk.App();
new ProcessAudioStack(app, 'ProcessAudioStack', {});
new EcsStack(app, 'EcsStack', {});
