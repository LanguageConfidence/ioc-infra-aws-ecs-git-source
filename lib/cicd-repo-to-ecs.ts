import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { GithubRepo } from './config';
import { SecretValue } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';


interface Git2EcsProps extends cdk.StackProps {
  gitRepo: GithubRepo;
  githubToken: SecretValue;
  cluster: ecs.Cluster;
}

export class CiCdGit2EcsStack extends cdk.Stack {
  public readonly uidService: string;
  constructor(scope: Construct, id: string, props: Git2EcsProps) {
    super(scope, id, props);
    
    this.uidService = props.gitRepo.owner + '-' + props.gitRepo.repo;

    const ecrRepo = new ecr.Repository(this, this.uidService);


    const RepoSource = codebuild.Source.gitHub({
        owner: props.gitRepo.owner,
        repo: props.gitRepo.repo,
        webhook: true, // optional, default: true if `webhookfilteres` were provided, false otherwise
        webhookFilters: [
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.prodBranch),
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.devBranch),
        ], // optional, by default all pushes and pull requests will trigger a build
    });

    new cdk.CfnOutput(this, 'ecrRepoUri', {
      value: ecrRepo.repositoryUri
    });
}}