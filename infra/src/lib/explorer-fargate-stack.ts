import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

// Define types for explorer configuration
interface ExplorerConfig {
//   image: string;
  cpu: number;
  memory: number;
  minCapacity: number;
  maxCapacity: number;
  desiredCount: number;
  scalingMetric: {
    namespace: string;
    metricName: string;
    dimensionName: string;
    dimensionValue: string;
    targetValue: number;
  };
}

interface InfrastructureConfig {
  environment: string;
  region: string;
}

export interface ExplorerFargateStackProps extends cdk.StackProps {
  config: {
    services: {
      infrastructure: InfrastructureConfig;
      explorer: ExplorerConfig;
    };
  };
  vpc: ec2.Vpc;
  redisEndpoint: string;
  redisPort: string;
  redisSecurityGroup: ec2.SecurityGroup;
  sqsQueue: sqs.Queue;
  // ECR repository no longer needed as we're using Docker Hub
}

export class ExplorerFargateStack extends cdk.Stack {
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  
  constructor(scope: Construct, id: string, props: ExplorerFargateStackProps) {
    super(scope, id, props);

    const infraConfig = props.config.services.infrastructure;
    const explorerConfig = props.config.services.explorer;

    // Create ECS cluster in the existing VPC
    const cluster = new ecs.Cluster(this, 'ExplorerCluster', {
      vpc: props.vpc,
      containerInsights: true,
    });

    // Create a security group for the explorer service
    const explorerSecurityGroup = new ec2.SecurityGroup(this, 'ExplorerSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Explorer Fargate service',
      allowAllOutbound: true,
    });

    // Allow explorer service to connect to Redis
    explorerSecurityGroup.addEgressRule(
      props.redisSecurityGroup,
      ec2.Port.tcp(parseInt(props.redisPort, 10)),
      'Allow access to Redis'
    );

    // Task execution role
    const executionRole = new iam.Role(this, 'ExplorerTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task role - will grant permissions to AWS services
    const taskRole = new iam.Role(this, 'ExplorerTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add CloudWatch permissions to push metrics
    taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
    }));
    
    // Add SQS permissions for the Explorer to read/write to the queue
    taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'sqs:SendMessage',
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
        'sqs:GetQueueUrl',
        'sqs:ChangeMessageVisibility'
      ],
      resources: [props.sqsQueue.queueArn],
    }));

    // Create a Fargate task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'ExplorerTaskDefinition', {
      memoryLimitMiB: explorerConfig.memory,
      cpu: explorerConfig.cpu,
      executionRole: executionRole,
      taskRole: taskRole,
    });

    // Create CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'ExplorerLogGroup', {
      logGroupName: `/blokbustr/explorer/${infraConfig.environment}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add container to the task definition
    const containerDefinition = this.taskDefinition.addContainer('ExplorerContainer', {
      // Use Docker Hub image instead of ECR
      image: ecs.ContainerImage.fromRegistry("abdelh2o/blokbustr-explorer:latest"),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'explorer',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: infraConfig.environment,
        REDIS_HOST: props.redisEndpoint,
        REDIS_PORT: props.redisPort,
        EXPLORER_QUEUE_URL: props.sqsQueue.queueUrl,
        AWS_REGION: infraConfig.region,
      },
    });

    // Create the Fargate service
    this.service = new ecs.FargateService(this, 'ExplorerService', {
      cluster: cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: explorerConfig.desiredCount,
      securityGroups: [explorerSecurityGroup],
      assignPublicIp: false, // Use private subnet with NAT gateway
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Create a scaling target
    const scalingTarget = new applicationautoscaling.ScalableTarget(this, 'ExplorerScalingTarget', {
      serviceNamespace: applicationautoscaling.ServiceNamespace.ECS,
      resourceId: `service/${cluster.clusterName}/${this.service.serviceName}`,
      scalableDimension: 'ecs:service:DesiredCount',
      minCapacity: explorerConfig.minCapacity,
      maxCapacity: explorerConfig.maxCapacity,
    });

    // Create scaling policy based on a custom metric (queue jobs count)
    const metric = new cloudwatch.Metric({
      namespace: explorerConfig.scalingMetric.namespace,
      metricName: explorerConfig.scalingMetric.metricName,
      dimensionsMap: {
        [explorerConfig.scalingMetric.dimensionName]: explorerConfig.scalingMetric.dimensionValue,
      },
      period: cdk.Duration.minutes(1),
      statistic: 'Average',
    });

    // Add scaling policy
    scalingTarget.scaleToTrackMetric('QueueBasedScalingPolicy', {
      customMetric: metric,
      targetValue: explorerConfig.scalingMetric.targetValue,
      scaleInCooldown: cdk.Duration.minutes(3),
      scaleOutCooldown: cdk.Duration.minutes(1),
      disableScaleIn: false,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ExplorerServiceArn', {
      value: this.service.serviceArn,
      description: 'ARN of the Explorer ECS Fargate Service',
      exportName: 'ExplorerServiceArn',
    });
    
    new cdk.CfnOutput(this, 'ExplorerClusterName', {
      value: cluster.clusterName,
      description: 'Name of the Explorer ECS Cluster',
      exportName: 'ExplorerClusterName',
    });
    
    new cdk.CfnOutput(this, 'ExplorerLogGroupName', {
      value: logGroup.logGroupName,
      description: 'Name of the Explorer CloudWatch Log Group',
      exportName: 'ExplorerLogGroupName',
    });
  }
}
