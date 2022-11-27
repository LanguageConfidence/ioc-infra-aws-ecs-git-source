#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecretStack } from '../lib/secret-stack';
import { Git2EcrStack } from '../lib/dummy/github2registry';
import { EcsStack } from '../lib/dummy/ecs-stack';
import { ComputeCluster } from '../lib/compute';
import envConfig from './config';
import { CpuTaskOnEcs } from '../lib/interfaces';
import { Git2EcsHttp } from '../lib/git-to-http-ecs';

const app = new cdk.App();

////////////////////////////////////////////////////////////////////
// This section is for basic infrastructure that share across all stacks
////////////////////////////////////////////////////////////////////
const secret = new SecretStack(app, 'SecretStack', {});

const compute = new ComputeCluster(app, 'ComputeCluster', {});

///////////////////////////////////////////////////////////////////
// Define your stacks action here /////////////////////////////////
///////////////////////////////////////////////////////////////////

const asrTask: CpuTaskOnEcs = {
    githubRepo: envConfig.GHREPO,
    githubOwner: envConfig.GHOWNER,
    githubBranch: envConfig.GHBRANCH,
    containerPort: 8888,
    cpu: 2048,
    memoryLimitMiB: 7168,
};

const endpoint = new Git2EcsHttp(app, 'Git2EcsHttp', {
    cluster: compute.cluster,
    task: asrTask,
    githubTokenName: secret.githubTokenName,
});


///////////////////////////////////////////////////////////////////
// const ecrSource = new Git2EcrStack(app, 'Git2EcrStack', {
//     githubTokenName: secret.githubTokenName,
//     githubRepo: envConfig.GHREPO,
//     githubOwner: envConfig.GHOWNER,
//     githubBranch: envConfig.GHBRANCH,
// });

// const cluster = new EcsStack(app, 'EcsStack', {
//     vpc: compute.privateVpc,
//     cluster: compute.cluster,
//     ecrRepo: ecrSource.ecrRepo,
//     tag: ecrSource.tag,
// });
