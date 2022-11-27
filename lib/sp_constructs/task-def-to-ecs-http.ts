import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

interface TaskDef2EcsHttpProps{
  cluster: ecs.Cluster;
  taskDefinition: ecs.FargateTaskDefinition;
  containerPort: number;
  desiredCount?: number;
  circuitBreaker?: boolean;
}  

export class TaskDef2EcsHttp extends Construct {
  public readonly url: string | undefined;

  constructor(scope: Construct, id: string, props: TaskDef2EcsHttpProps) {
    super(scope, id);
    const taskDefinition = props.taskDefinition
    const cluster = props.cluster
    const cluster_vpc = cluster.vpc
    const containerPort = props.containerPort;
    const desiredCount = props.desiredCount || 1;
    const circuitBreaker = props.circuitBreaker || true;

    // Create Security Group to allow traffic to the Service
    const serviceSecurityGroup = new ec2.SecurityGroup(this, `security-gr`, {
      vpc: cluster_vpc,
      allowAllOutbound: true,
      description: 'Allow traffic to Fargate HTTP API service.',
      securityGroupName: `security-gr`,
    });

    serviceSecurityGroup.addIngressRule(ec2.Peer.ipv4(cluster_vpc.vpcCidrBlock), ec2.Port.tcp(containerPort));

    // Create Service Discovery (Cloud Map) namespace
    const dnsNamespace = new servicediscovery.PrivateDnsNamespace(this, `cloud-map-ns`, {
      name: 'speechrefine.local',
      vpc: cluster_vpc,
    });
    
    // Create the ECS service and register it to Service Discovery (Cloud Map)
    const service = new ecs.FargateService(this, `ecs-service`, {
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
        rollback: circuitBreaker,
      },
      assignPublicIp: false,
      desiredCount: desiredCount,
      cloudMapOptions: {
        name: 'service',
        cloudMapNamespace: dnsNamespace,
        dnsRecordType: servicediscovery.DnsRecordType.SRV,
      },
    });  

    // Create API Gateway VPC Link to get the service connected to VPC
    const vpcLink = new apigatewayv2.VpcLink(this, 'VpcLink', {
      vpc: cluster_vpc,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });
    

    // Create API Gateway HTTP API and point it to the ECS service via Service Discovery and VPC Link
    const api = new apigatewayv2.HttpApi(this, `api`, {
      defaultIntegration: new apigatewayv2_integrations.HttpServiceDiscoveryIntegration(
        `http-api-integration`,
        //@ts-ignore
        service.cloudMapService,
        {
          vpcLink: vpcLink,
        },
      ),
    });

    this.url = api.url;
    // Print out the API endpoint after the deploy
    new cdk.CfnOutput(this, 'Url', {
      value: this.url ?? 'Something went wrong',
    });    
  }
}