import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface EcrStackProps extends cdk.StackProps {
  config: {
    services: {
      watcher: any;
      explorer: { enabled: boolean };
      identifier: { enabled: boolean };
    }
  }
}

export class EcrStack extends cdk.Stack {
  // Expose the repositories so other stacks can use them
  public readonly watcherRepository: ecr.Repository;
  public readonly explorerRepository?: ecr.Repository;
  public readonly identifierRepository?: ecr.Repository;
  
  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);
    
    // Create ECR repository for watcher service
    this.watcherRepository = new ecr.Repository(this, 'WatcherRepository', {
      repositoryName: 'blokbuster/watcher',
      imageScanOnPush: true, // Enable vulnerability scanning
      lifecycleRules: [
        {
          maxImageCount: 5, // Keep only 5 latest images to save costs
          description: 'Only keep 5 most recent images'
        }
      ]
    });
    
    // Output the repository URI
    new cdk.CfnOutput(this, 'WatcherRepositoryUri', {
      value: this.watcherRepository.repositoryUri,
      description: 'The URI of the Watcher ECR Repository',
      exportName: 'WatcherRepositoryUri'
    });
    
    // Create repositories for future services if they're enabled
    if (props.config.services.explorer?.enabled) {
      this.explorerRepository = new ecr.Repository(this, 'ExplorerRepository', {
        repositoryName: 'blokbuster/explorer',
        imageScanOnPush: true,
        lifecycleRules: [{ maxImageCount: 5 }]
      });
      
      new cdk.CfnOutput(this, 'ExplorerRepositoryUri', {
        value: this.explorerRepository.repositoryUri,
        description: 'The URI of the Explorer ECR Repository',
        exportName: 'ExplorerRepositoryUri'
      });
    }
    
    if (props.config.services.identifier?.enabled) {
      this.identifierRepository = new ecr.Repository(this, 'IdentifierRepository', {
        repositoryName: 'blokbuster/identifier',
        imageScanOnPush: true,
        lifecycleRules: [{ maxImageCount: 5 }]
      });
      
      new cdk.CfnOutput(this, 'IdentifierRepositoryUri', {
        value: this.identifierRepository.repositoryUri,
        description: 'The URI of the Identifier ECR Repository',
        exportName: 'IdentifierRepositoryUri'
      });
    }
  }
}
