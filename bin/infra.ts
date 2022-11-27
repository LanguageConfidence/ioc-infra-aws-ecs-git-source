#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecretStack } from '../lib/secret-stack';
import { Git2EcrStack } from '../lib/github2registry';
import { EcsStack } from '../lib/ecs-stack';
import { ComputeCluster } from '../lib/compute';
import envConfig from './config';

const app = new cdk.App();

////////////////////////////////////////////////////////////////////
// This section is for basic infrastructure that share across all stacks
////////////////////////////////////////////////////////////////////
const secret = new SecretStack(app, 'SecretStack', {});

const compute = new ComputeCluster(app, 'ComputeCluster', {});

///////////////////////////////////////////////////////////////////
// Define your stacks action here /////////////////////////////////
///////////////////////////////////////////////////////////////////

const ecrSource = new Git2EcrStack(app, 'Git2EcrStack', {
    githubTokenName: secret.githubTokenName,
    githubRepo: envConfig.GHREPO,
    githubOwner: envConfig.GHOWNER,
    githubBranch: envConfig.GHBRANCH,
});

const cluster = new EcsStack(app, 'EcsStack', {
    vpc: compute.privateVpc,
    cluster: compute.cluster,
    ecrRepo: ecrSource.ecrRepo,
    tag: ecrSource.tag,
});
