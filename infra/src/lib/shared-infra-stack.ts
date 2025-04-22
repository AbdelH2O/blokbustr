import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sqs from 'aws-cdk-lib/aws-sqs';

// Define types for shared infrastructure configuration
interface RedisConfig {
	nodeType: string;
	numShards: number;
	replicas: number;
	autoMinorVersionUpgrade: boolean;
}

interface VpcConfig {
	maxAzs: number;
	natGateways: number;
}

export interface SharedInfraConfig {
	environment: string;
	region: string;
	vpc: VpcConfig;
	redis: RedisConfig;
}

export interface SharedInfraStackProps extends cdk.StackProps {
	config: {
		services: {
			infrastructure: SharedInfraConfig;
		};
	};
}

export class SharedInfraStack extends cdk.Stack {
	// Export these resources for other stacks to use
	public readonly vpc: ec2.Vpc;
	public readonly redisEndpointAddress: string;
	public readonly redisEndpointPort: string;
	public readonly redisSecurityGroup: ec2.SecurityGroup;
	public readonly explorerQueue: sqs.Queue;

	constructor(scope: cdk.App, id: string, props: SharedInfraStackProps) {
		super(scope, id, props);

		const infraConfig = props.config.services.infrastructure;

		// Create a VPC that will be shared across services
		this.vpc = new ec2.Vpc(this, 'SharedVpc', {
			maxAzs: infraConfig.vpc.maxAzs || 2,
			natGateways: infraConfig.vpc.natGateways || 1,
		});

		// Create a security group for the Redis cluster
		this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
			vpc: this.vpc,
			description: 'Security group for Redis cluster',
			allowAllOutbound: true,
		});

		// Create a subnet group for the Redis cluster
		const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
			description: 'Subnet group for Redis cluster',
			subnetIds: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
		});

		// Create the Redis cluster
		const redisConfig = infraConfig.redis;
		const redisCluster = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
			replicationGroupDescription: 'Redis cluster for Blokbustr services',
			engine: 'redis',
			cacheNodeType: redisConfig.nodeType || 'cache.t3.micro',
			numNodeGroups: redisConfig.numShards || 1,
			replicasPerNodeGroup: redisConfig.replicas || 0,
			automaticFailoverEnabled: redisConfig.replicas > 0,
			autoMinorVersionUpgrade: redisConfig.autoMinorVersionUpgrade !== false,
			securityGroupIds: [this.redisSecurityGroup.securityGroupId],
			cacheSubnetGroupName: redisSubnetGroup.ref,
			// Additional optional parameters can be added as needed
		});

		// Store the Redis endpoint information
		this.redisEndpointAddress = redisCluster.attrPrimaryEndPointAddress;
		this.redisEndpointPort = redisCluster.attrPrimaryEndPointPort;

		// Store the Redis connection information in SSM Parameter Store for other stacks/services to use
		new ssm.StringParameter(this, 'RedisEndpointParam', {
			parameterName: `/${infraConfig.environment}/blokbustr/redis/endpoint`,
			stringValue: this.redisEndpointAddress,
			description: 'Redis cluster endpoint address',
		});

		new ssm.StringParameter(this, 'RedisPortParam', {
			parameterName: `/${infraConfig.environment}/blokbustr/redis/port`,
			stringValue: this.redisEndpointPort,
			description: 'Redis cluster endpoint port',
		});

		// Export the Redis endpoint and VPC ID for cross-stack references
		new cdk.CfnOutput(this, 'RedisEndpoint', {
			value: this.redisEndpointAddress,
			description: 'Redis cluster endpoint address',
			exportName: 'BlokbustrRedisEndpoint',
		});

		new cdk.CfnOutput(this, 'RedisPort', {
			value: this.redisEndpointPort,
			description: 'Redis cluster endpoint port',
			exportName: 'BlokbustrRedisPort',
		});

		new cdk.CfnOutput(this, 'VpcId', {
			value: this.vpc.vpcId,
			description: 'ID of the shared VPC',
			exportName: 'BlokbustrVpcId',
		});

		// Create an SQS queue for explorer service
		this.explorerQueue = new sqs.Queue(this, 'ExplorerQueue', {
			queueName: `blokbustr-explorer-${infraConfig.environment}`,
			visibilityTimeout: cdk.Duration.seconds(300),
			retentionPeriod: cdk.Duration.days(7),
		});

		// Store the Queue URL in SSM Parameter Store
		new ssm.StringParameter(this, 'ExplorerQueueUrlParam', {
			parameterName: `/${infraConfig.environment}/blokbustr/explorer/queue-url`,
			stringValue: this.explorerQueue.queueUrl,
			description: 'Explorer SQS queue URL',
		});

		// Export the Queue URL for cross-stack references
		new cdk.CfnOutput(this, 'ExplorerQueueUrl', {
			value: this.explorerQueue.queueUrl,
			description: 'URL of the Explorer SQS Queue',
			exportName: 'BlokbustrExplorerQueueUrl',
		});
	}
}
