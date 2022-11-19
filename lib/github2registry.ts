import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { GithubRepo } from './config';
import { SecretValue } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

interface Git2RegistryProps extends cdk.StackProps {
  gitRepo: GithubRepo;
  githubToken: SecretValue;
  githubTokenName: string;
}

export class Git2RegistryStack extends cdk.Stack {
  public readonly uidService: string;
  public readonly uriEcrRepo: string;
  constructor(scope: Construct, id: string, props: Git2RegistryProps) {
    super(scope, id, props);
    
    this.uidService = `${props.gitRepo.owner}-${props.gitRepo.repo}`;

    const ecrRepo = new ecr.Repository(this, `${this.uidService}-ecr-repo`);
    const tag = "latest";

    const gitHubSource = codebuild.Source.gitHub({
      owner: props.gitRepo.owner,
      repo: props.gitRepo.repo,
      webhook: true, // optional, default: true if `webhookfilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.prodBranch),
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.devBranch),
      ], // optional, by default all pushes and pull requests will trigger a build
    });
    
    new codebuild.GitHubSourceCredentials(this, 'CodeBuildGitHubCreds', {
      accessToken: SecretValue.secretsManager(props.githubTokenName),
    });
    
    const project = new codebuild.Project(this, `${this.uidService}-git-to-ecr`, {
      projectName: `${this.uidService}-project`,
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true,
      },
      environmentVariables: {
        'ecr_repo_uri': {
          value: `${ecrRepo.repositoryUri}`
        },
      },
      badge: true,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              `export tag=${tag}`
            ],
          },
          build: {
            commands: [
              'docker build -t $ecr_repo_uri:$tag .',
              '$(aws ecr get-login --no-include-email)',
              'docker push $ecr_repo_uri:$tag',
            ],
          },
        },
      }),
    });

    ecrRepo.grantPullPush(project.role!)

    this.uriEcrRepo = ecrRepo.repositoryUri;

    new cdk.CfnOutput(this, "ecrImage", { value: `${ecrRepo.repositoryUri}:${tag}`})

}}