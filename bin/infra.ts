#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecretStack } from '../lib/secret-stack';
import { Git2RegistryStack } from '../lib/github2registry';
import { EcsStack } from '../lib/ecs-stack';
import { ApigwLambdaMiddleware } from '../lib/apigwlambda';
import { ComputeCluster } from '../lib/network';

const app = new cdk.App();

////////////////////////////////////////////////////////////////////
// This section is for basic infrastructure that share across all task
////////////////////////////////////////////////////////////////////
const secret = new SecretStack(app, 'SecretStack', {});

const compute = new ComputeCluster(app, 'ComputeCluster', {});

// Define your compute action here /////////////////////////////////
const cicd = new Git2RegistryStack(app, 'Git2RegistryStack', {
    githubTokenName: secret.githubTokenName,
});



const cluster = new EcsStack(app, 'EcsStack', {
    vpc: compute.privateVpc,
    ecrRepo: cicd.ecrRepo,
    tag: cicd.tag,
});

const apigw = new ApigwLambdaMiddleware(app, 'ApigwLambdaMiddleware', {});
