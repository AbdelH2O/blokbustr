# BlokBustr - Blockchain forensics Platform

BlokBustr is a comprehensive platform for blockchain forensics, designed to monitor and analyze blockchain events. It provides a robust architecture for real-time data processing and analytics, leveraging modern technologies like SvelteKit, Redis, and AWS services.
The platform is built with a focus on modularity and scalability, allowing for easy integration of new features and services.

## Project Structure

The project follows a monorepo structure using Turborepo with the following components:

- **apps**
	- `landing`: Frontend application 
	- `visu`: Visualization application for displaying `explorer` results
- **packages**
	- `schema`: Shared types and schemas
	- `providers`: Blockchain provider interfaces
- **services**
	- `watcher`: Service for monitoring blockchain events
	- `explorer`: Service for processing, following, and analyzing transactions
	- `identifier`: Service for identifying and storing wallets and their owner (exchanges, etc.)
- **infra**: Infrastructure as code (using AWS CDK)

## Prerequisites

- Node.js (minimum v18.16.0)
- PNPM package manager (v9.14.2)
- Docker and Docker Compose

## Environment Setup

1. Clone the repository
2. Install dependencies:
	 ```
	 pnpm install
	 ```

## Running Locally

The project uses Docker Compose for local development:

```bash
docker-compose up
```

This will start:
- Redis cache
- LocalStack for AWS service emulation
- SQS queue initialization
- Watcher service
- Explorer service

### Services Configuration

The Watcher service requires the following environment variables:
- `REDIS_URL`: Redis connection URL
- `WATCHER_CHAIN`: Blockchain to monitor (e.g., ETHEREUM)
- `SOCKET_CONNECTION`: WebSocket connection flag
- `AWS_ENDPOINT_URL`: SQS endpoint URL
- `AWS_REGION`: AWS region
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### Development Commands

```bash
# Start development servers
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check-types
```

## Architecture

1. **Watcher Service**: Monitors blockchain events and saves them to a database
2. **Explorer Service**: Consumes events from SQS queue and processes blockchain data
3. **Identifier Service**: Identifies wallets and their owners (exchanges, etc.)
4. **Frontend**: Displays analytics and blockchain data to users

## Infrastructure

The infrastructure is managed with AWS CDK, with configuration files in the `infra` directory.

## Technologies

- TypeScript
- Svelte/SvelteKit
- Redis
- AWS SQS
- Ethers.js/Bitcoin Core
- Docker
- Turborepo

## License

MIT License - See license file for details.

## Author

AbdelH2O
