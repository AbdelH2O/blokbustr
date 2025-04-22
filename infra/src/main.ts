#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';
import { SharedInfraStack, SharedInfraStackProps } from './lib/shared-infra-stack';
import { WatcherEC2Stack, WatcherStackProps } from './lib/watcher-ec2-stack';
// import { EcrStack, EcrStackProps } from './lib/ecr-stack';
import { ExplorerFargateStack, ExplorerFargateStackProps } from './lib/explorer-fargate-stack';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Load central configuration file
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = new cdk.App();

// Set common environment for all stacks
const env = { 
  account: process.env.AWS_ACCESS_KEY_ID, 
  region: process.env.CDK_DEFAULT_REGION || config.services.infrastructure?.region || 'us-east-1'
};

// Create ECR repositories first
// const ecrStack = new EcrStack(app, 'BlokbusterEcrStack', {
//   env,
//   description: 'ECR repositories for Blokbuster services',
//   config: config
// } as EcrStackProps);

// Deploy the shared infrastructure stack first (VPC, Redis, etc.)
const sharedInfra = new SharedInfraStack(app, 'BlokbustrSharedInfraStack', {
  env,
  description: 'Blokbustr shared infrastructure with VPC and Redis',
  config: config
} as SharedInfraStackProps);

// Deploy watcher stack with configuration, depending on shared infrastructure
new WatcherEC2Stack(app, 'BlokbustrWatcherStack', {
  env,
  description: 'Blokbustr blockchain watcher services running on EC2',
  config: config,
  // Pass the shared infrastructure resources
  vpc: sharedInfra.vpc,
  redisEndpoint: sharedInfra.redisEndpointAddress,
  redisPort: sharedInfra.redisEndpointPort,
  redisSecurityGroup: sharedInfra.redisSecurityGroup
  // No longer passing ECR repository as we're using Docker Hub images
} as WatcherStackProps);

// Deploy explorer stack with configuration on Fargate with auto-scaling
new ExplorerFargateStack(app, 'BlokbustrExplorerStack', {
  env,
  description: 'Blokbustr explorer services running on Fargate with auto-scaling',
  config: config,
  // Pass the shared infrastructure resources
  vpc: sharedInfra.vpc,
  redisEndpoint: sharedInfra.redisEndpointAddress,
  redisPort: sharedInfra.redisEndpointPort,
  redisSecurityGroup: sharedInfra.redisSecurityGroup,
  sqsQueue: sharedInfra.explorerQueue
  // No longer passing ECR repository as we're using Docker Hub images
} as ExplorerFargateStackProps);

app.synth();
