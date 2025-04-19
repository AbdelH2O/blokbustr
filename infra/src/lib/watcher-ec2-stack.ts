import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ecr from 'aws-cdk-lib/aws-ecr';

// Define types based on config.json structure
interface WatcherInstance {
	chain: string;
	type: string;
	cpu: number;
	memory: number;
}

interface WatcherConfig {
	image: string;
	instances: WatcherInstance[];
}

interface InfrastructureConfig {
	environment: string;
	region: string;
	vpc: {
		maxAzs: number;
		natGateways: number;
	};
	instances: {
		watcher: {
			instanceType: string;
			diskSize: number;
		};
	};
	redis: {
		nodeType: string;
		numShards: number;
		replicas: number;
		autoMinorVersionUpgrade: boolean;
	}
}

interface DockerComposeService {
	image: string;
	environment: Record<string, string>;
	restart: string;
	logging: {
		driver: string;
		options: Record<string, string>;
	};
}

interface DockerComposeConfig {
	version: string;
	services: Record<string, DockerComposeService>;
}

// Define an interface for our stack props that includes the configuration
export interface WatcherStackProps extends cdk.StackProps {
	config: {
		services: {
			watcher: WatcherConfig;
			explorer: {
				enabled: boolean;
				port: number;
				apiVersion: string;
			};
			identifier: {
				enabled: boolean;
				port: number;
			};
			infrastructure: InfrastructureConfig;
		};
	};
	// Shared infrastructure resources
	vpc: ec2.Vpc;
	redisEndpoint: string;
	redisPort: string;
	redisSecurityGroup: ec2.SecurityGroup;
	// ECR repository for Docker images
	ecrRepository: ecr.Repository;
}

export class WatcherEC2Stack extends cdk.Stack {
	constructor(scope: cdk.App, id: string, props: WatcherStackProps) {
		super(scope, id, props);

		// Get configuration from props
		const WATCHER_CONFIG = props.config.services.watcher;
		const WATCHER_INSTANCES = WATCHER_CONFIG.instances;
		const INFRA_CONFIG = props.config.services.infrastructure;
		const ecrRepositoryUri = props.ecrRepository.repositoryUri;

		// Use the shared VPC passed from the SharedInfraStack
		const vpc = props.vpc;

		// Create role for the EC2 instance
		const role = new iam.Role(this, 'WatcherInstanceRole', {
			assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
				iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
				iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECR-ReadOnly') // Add ECR read permissions
			]
		});

		// Create security group
		const securityGroup = new ec2.SecurityGroup(this, 'WatcherSecurityGroup', {
			vpc,
			description: 'Security group for watcher instances',
			allowAllOutbound: true
		});

		// Generate a dynamic docker-compose file based on our configuration
		const dockerComposeContent = this.generateDockerComposeFile(WATCHER_INSTANCES, props.redisEndpoint, props.redisPort, ecrRepositoryUri);
		const setupScriptContent = this.generateSetupScript(dockerComposeContent);

		// Create the EC2 instance using configuration from central config file
		const instanceTypeStr = INFRA_CONFIG.instances.watcher.instanceType || 't3.medium';
		const [instanceClass, instanceSize] = instanceTypeStr.split('.');

		const instance = new ec2.Instance(this, 'WatcherInstance', {
			vpc,
			instanceType: ec2.InstanceType.of(
				instanceClass as ec2.InstanceClass,
				instanceSize.toUpperCase() as ec2.InstanceSize
			),
			machineImage: ec2.MachineImage.latestAmazonLinux2023(),
			securityGroup,
			role,
			userData: ec2.UserData.custom(setupScriptContent),
			blockDevices: [
				{
					deviceName: '/dev/xvda',
					volume: ec2.BlockDeviceVolume.ebs(
						INFRA_CONFIG.instances.watcher.diskSize || 20
					),
				},
			],
		});

		// Create CloudWatch metrics and alarms for monitoring
		this.createCloudWatchResources(instance, WATCHER_INSTANCES);
	}  /**
   * Generates docker-compose content based on watcher configurations
   * Now uses a single image with different environment variables
   */
	private generateDockerComposeFile(instances: WatcherInstance[], redisEndpoint: string, redisPort: string, ecrRepositoryUri: string): string {
		let services: Record<string, DockerComposeService> = {};
		
		// Use the ECR repository URI instead of the config image
		const imageUri = ecrRepositoryUri;

		// Create a service for each watcher instance, using the same base image
		instances.forEach(instance => {
			const serviceName = `${instance.chain.toLowerCase()}-${instance.type.toLowerCase()}`;
			services[serviceName] = {
				image: imageUri, // Using the ECR image for all instances
				environment: {
					WATCHER_CHAIN: instance.chain,
					SOCKET_CONNECTION: instance.type === "socket" ? "true" : "false",
					// Add Redis connection information
					REDIS_HOST: redisEndpoint,
					REDIS_PORT: redisPort.toString(),
				},
				restart: 'always',
				logging: {
					driver: 'awslogs',
					options: {
						'awslogs-region': this.region,
						'awslogs-group': '/blokbuster/watchers',
						'awslogs-stream-prefix': `${instance.chain}-${instance.type}`
					}
				}
			};
		});

		const dockerCompose: DockerComposeConfig = {
			version: '3',
			services
		};

		return JSON.stringify(dockerCompose, null, 2);
	}

	/**
	 * Generates the user data script to set up the instance
	 */
	private generateSetupScript(dockerComposeContent: string): string {
		return `#!/bin/bash
# Update system packages
yum update -y

# Install Docker and other utilities
yum install -y docker jq amazon-cloudwatch-agent

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create logs directory
mkdir -p /var/log/blokbuster

# Create the docker-compose.yml file
cat > /home/ec2-user/docker-compose.yml << 'EOF'
${dockerComposeContent}
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/blokbuster/*.log",
            "log_group_name": "/blokbuster/watchers",
            "log_stream_name": "{instance_id}-{filename}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "Blokbustr/Watcher",
    "metrics_collected": {
      "cpu": {
        "resources": [
          "*"
        ],
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_user",
          "cpu_usage_system"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ]
      }
    }
  }
}
EOF

# Start the CloudWatch agent
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

# Start containers
cd /home/ec2-user
docker-compose up -d

# Create a health check script
cat > /home/ec2-user/health_check.sh << 'EOF'
#!/bin/bash
# Check if all containers are running
RUNNING_CONTAINERS=$(docker ps -q | wc -l)
EXPECTED_CONTAINERS=$(docker-compose ps -q | wc -l)

if [ "$RUNNING_CONTAINERS" -ne "$EXPECTED_CONTAINERS" ]; then
  echo "Container health check failed: $RUNNING_CONTAINERS running out of $EXPECTED_CONTAINERS expected" | tee /var/log/blokbuster/health.log
  exit 1
fi
echo "Container health check passed: all containers running" | tee /var/log/blokbuster/health.log
exit 0
EOF

# Make the script executable
chmod +x /home/ec2-user/health_check.sh

# Set up a cron job to run the health check script
echo "*/5 * * * * /home/ec2-user/health_check.sh" | crontab -
`;
	}

	/**
	 * Creates CloudWatch resources for monitoring the watchers
	 */
	private createCloudWatchResources(instance: ec2.Instance, watchers: WatcherInstance[]): void {
		// Create a dashboard
		const dashboard = new cloudwatch.Dashboard(this, 'WatcherDashboard', {
			dashboardName: 'BlokbusterWatchers'
		});

		// Create CPU metric
		const cpuMetric = new cloudwatch.Metric({
			namespace: 'AWS/EC2',
			metricName: 'CPUUtilization',
			dimensionsMap: {
				InstanceId: instance.instanceId
			},
			statistic: 'Average',
			period: cdk.Duration.minutes(5)
		});

		// Add CPU and Memory widgets
		dashboard.addWidgets(
			new cloudwatch.GraphWidget({
				title: 'CPU Usage',
				left: [cpuMetric],
			}),
			new cloudwatch.GraphWidget({
				title: 'Memory Usage',
				left: [
					new cloudwatch.Metric({
						namespace: 'Blokbustr/Watcher',
						metricName: 'mem_used_percent',
						dimensionsMap: {
							InstanceId: instance.instanceId
						},
						statistic: 'Average',
					})
				],
			})
		);

		// Create an alarm for high CPU usage
		new cloudwatch.Alarm(this, 'HighCPUAlarm', {
			metric: cpuMetric,
			threshold: 80,
			evaluationPeriods: 3,
			datapointsToAlarm: 2,
			alarmDescription: 'Alarm when CPU exceeds 80% for 15 minutes',
		});

		// Create status metrics for each watcher
		watchers.forEach(watcher => {
			new cloudwatch.Metric({
				namespace: 'Blokbustr/Watcher',
				metricName: 'WatcherStatus',
				dimensionsMap: {
					Chain: watcher.chain,
					Type: watcher.type,
				},
			});
		});
	}
}
