import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { GithubRepo } from './config';
import { SecretValue } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

interface Git2RegistryProps extends cdk.StackProps {
  gitRepo: GithubRepo;
  githubToken: SecretValue;
  githubTokenName: string;
}

export class Git2RegistryStack extends cdk.Stack {
  public readonly uidService: string;
  constructor(scope: Construct, id: string, props: Git2RegistryProps) {
    super(scope, id, props);
    
    this.uidService = `${props.gitRepo.owner}-${props.gitRepo.repo}`;

    const ecrRepo = new ecr.Repository(this, `${this.uidService}-ecr-repo`);


    const gitHubSource = codebuild.Source.gitHub({
      owner: props.gitRepo.owner,
      repo: props.gitRepo.repo,
      webhook: true, // optional, default: true if `webhookfilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.prodBranch),
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.devBranch),
      ], // optional, by default all pushes and pull requests will trigger a build
    });

    // const project = new codebuild.Project(this, `${this.uidService}-git-to-ecr`, {
    //     projectName: `${this.uidService}-project`,

    new cdk.CfnOutput(this, 'uidService', {
        value: this.uidService,
    });

}}