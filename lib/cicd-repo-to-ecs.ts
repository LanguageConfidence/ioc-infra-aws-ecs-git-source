import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { GithubRepo } from './config';
import { SecretValue } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { BaseFargateSv } from './sp_constructs/fargate_service_construct';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

interface Git2EcsProps extends cdk.StackProps {
  gitRepo: GithubRepo;
  githubToken: SecretValue;
  githubTokenName: string;
  cluster: ecs.Cluster;
}

export class CiCdGit2EcsStack extends cdk.Stack {
  public readonly uidService: string;
  constructor(scope: Construct, id: string, props: Git2EcsProps) {
    super(scope, id, props);
    
    this.uidService = props.gitRepo.owner + '-' + props.gitRepo.repo;

    const ecrRepo = new ecr.Repository(this, this.uidService + "-ecr-repo");

    const fargateService = new BaseFargateSv(this, this.uidService + "-fargate-service", {
        cluster: props.cluster,
        cpu: 512,
        memoryLimitMiB: 1024,
        desiredCount: 1,
        maxCapacity: 2,
        scaleOnCpuUtilizationPer: 50,
        listenPort: 8888,}
    )

    const gitHubSource = codebuild.Source.gitHub({
      owner: props.gitRepo.owner,
      repo: props.gitRepo.repo,
      webhook: true, // optional, default: true if `webhookfilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.prodBranch),
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.gitRepo.devBranch),
      ], // optional, by default all pushes and pull requests will trigger a build
    });

    // codebuild - project
    const project = new codebuild.Project(this, 'myProject', {
        projectName: `${this.stackName}`,
        source: gitHubSource,
        environment: {
          buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
          privileged: true
        },
        environmentVariables: {
          'cluster_name': {
            value: `${props.cluster.clusterName}`
          },
          'ecr_repo_uri': {
            value: `${ecrRepo.repositoryUri}`
          }
        },
        badge: true,
        // TODO - I had to hardcode tag here
        buildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            pre_build: {
              /*
              commands: [
                'env',
                'export tag=${CODEBUILD_RESOLVED_SOURCE_VERSION}'
              ]
              */
              commands: [
                'env',
                'export tag=latest'
              ]
            },
            build: {
              commands: [
                'cd flask-docker-app',
                `docker build -t $ecr_repo_uri:$tag .`,
                '$(aws ecr get-login --no-include-email)',
                'docker push $ecr_repo_uri:$tag'
              ]
            },
            post_build: {
              commands: [
                'echo "in post-build stage"',
                'cd ..',
                "printf '[{\"name\":\"flask-app\",\"imageUri\":\"%s\"}]' $ecr_repo_uri:$tag > imagedefinitions.json",
                "pwd; ls -al; cat imagedefinitions.json"
              ]
            }
          },
          artifacts: {
            files: [
              'imagedefinitions.json'
            ]
          }
        })
      });
    
    
    // ***pipeline actions***

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'github_source',
      owner: props.gitRepo.owner,
      repo: props.gitRepo.repo,
      branch: 'main',
      oauthToken: cdk.SecretValue.secretsManager(props.githubTokenName),
      output: sourceOutput
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'codebuild',
      project: project,
      input: sourceOutput,
      outputs: [buildOutput], // optional
    });

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'approve',
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'deployAction',
      service: fargateService.service,
      imageFile: new codepipeline.ArtifactPath(buildOutput, `imagedefinitions.json`)
    });

    // NOTE - Approve action is commented out!
    new codepipeline.Pipeline(this, 'myecspipeline', {
      stages: [
        {
          stageName: 'source',
          actions: [sourceAction],
        },
        {
          stageName: 'build',
          actions: [buildAction],
        },
        {
          stageName: 'approve',
          actions: [manualApprovalAction],
        },
        {
          stageName: 'deploy-to-ecs',
          actions: [deployAction],
        }
      ]
    });
    

    ecrRepo.grantPullPush(project.role!)
    project.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        "ecs:describecluster",
        "ecr:getauthorizationtoken",
        "ecr:batchchecklayeravailability",
        "ecr:batchgetimage",
        "ecr:getdownloadurlforlayer"
        ],
      resources: [`${props.cluster.clusterArn}`],
    }));



    new cdk.CfnOutput(this, 'ServiceUrl', { 
      value: fargateService.loadBalancer.loadBalancerDnsName 
    });

    new cdk.CfnOutput(this, 'ecrRepoUri', {
      value: ecrRepo.repositoryUri
    });
}}