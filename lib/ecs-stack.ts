import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

interface EcsClusterProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  ecrRepo: ecr.Repository;
  tag: string;
}

export class EcsStack extends cdk.Stack {
  public readonly myCluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterProps) {
    super(scope, id, props);
    const clusterName = "MlCluster";
    const port = 8888;
    const cluster = new ecs.Cluster(this, clusterName, {
      vpc: props.vpc,
      enableFargateCapacityProviders: true,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, `${clusterName}-taskdef`, {
      cpu: 2048,
      memoryLimitMiB: 7168,
    });

    const container = taskDefinition.addContainer(`${clusterName}-container`, {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepo, props.tag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${clusterName}-container`,
      }),
    });

    container.addPortMappings({ containerPort: port });

    // Create Security Group to allow traffic to the Service
    const serviceSecurityGroup = new ec2.SecurityGroup(this, `${clusterName}-security-gr`, {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Allow traffic to Fargate HTTP API service.',
      securityGroupName: `${clusterName}-security-gr`,
    });

    serviceSecurityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(port));

    // Create Service Discovery (Cloud Map) namespace
    const dnsNamespace = new servicediscovery.PrivateDnsNamespace(this, `${clusterName}-cloud-map-ns`, {
      name: 'speechrefine.local',
      vpc: props.vpc,
    });
    
    // Create the ECS service and register it to Service Discovery (Cloud Map)
    const service = new ecs.FargateService(this, `${clusterName}-Asr-service`, {
      cluster: cluster,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 0,
        },
      ],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [serviceSecurityGroup],
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      taskDefinition: taskDefinition,
      circuitBreaker: {
        rollback: true,
      },
      assignPublicIp: false,
      desiredCount: 1,
      cloudMapOptions: {
        name: 'service',
        cloudMapNamespace: dnsNamespace,
        dnsRecordType: servicediscovery.DnsRecordType.SRV,
      },
    });  

    // Create API Gateway VPC Link to get the service connected to VPC
    const vpcLink = new apigatewayv2.VpcLink(this, 'HonkVpcLink', {
      vpc: props.vpc,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });
    

    // Create API Gateway HTTP API and point it to the ECS service via Service Discovery and VPC Link
    const api = new apigatewayv2.HttpApi(this, `${clusterName}-api`, {
      defaultIntegration: new apigatewayv2_integrations.HttpServiceDiscoveryIntegration(
        `${clusterName}-http-api-integration`,
        //@ts-ignore
        service.cloudMapService,
        {
          vpcLink: vpcLink,
        },
      ),
    });

    // Print out the API endpoint after the deploy
    new cdk.CfnOutput(this, 'Url', {
      value: api.url ?? 'Something went wrong',
    });
  }
}
