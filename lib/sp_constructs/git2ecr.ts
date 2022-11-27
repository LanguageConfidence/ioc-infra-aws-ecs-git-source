import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

interface Git2EcrProps{
  githubTokenName: string;
  githubRepo: string;
  githubOwner: string;
  githubBranch: string;
}


export class Git2Ecr extends Construct {
  public readonly ecrRepo: ecr.Repository;
  public readonly tag: string;

  constructor(scope: Construct, id: string, props: Git2EcrProps) {
    super(scope, id);
    const uidService = `${props.githubOwner}-${props.githubRepo}`;

    this.ecrRepo = new ecr.Repository(this, `${uidService}-ecr-repo`, {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    
    this.tag = "latest";

    const gitHubSource = codebuild.Source.gitHub({
      owner: props.githubOwner,
      repo: props.githubRepo,
      webhook: true, // optional, default: true if `webhookfilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PULL_REQUEST_MERGED).andBranchIs(props.githubBranch),
      ], // optional, by default all pushes and pull requests will trigger a build
    });
    
    new codebuild.GitHubSourceCredentials(this, 'CodeBuildGitHubCreds', {
      accessToken: SecretValue.secretsManager(props.githubTokenName),
    });
    
    const project = new codebuild.Project(this, `${uidService}-git-to-ecr`, {
      projectName: `${uidService}-project`,
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true,
      },
      environmentVariables: {
        'ecr_repo_uri': {
          value: `${this.ecrRepo.repositoryUri}`
        },
      },
      badge: true,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              `export tag=${this.tag}`
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

    this.ecrRepo.grantPullPush(project.role!)
    new cdk.CfnOutput(this, 'EcrRepoName', {
      value: this.ecrRepo.repositoryName,
    });
    new cdk.CfnOutput(this, 'tag', {
      value: this.tag,
    });
  }
}