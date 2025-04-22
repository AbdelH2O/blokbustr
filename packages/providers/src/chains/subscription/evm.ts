import { ethers } from "ethers";
import { ChainSubscriptionProvider, ConnectionType } from "@/types.js";
import { Chain, StandardTransaction } from "@blokbustr/schema";
import { getClient } from "@/clients/index.js";
import { evmLogger, subscriptionLogger } from "@/utils/logger.js";

async function processTransaction(txHash: string, provider: ethers.Provider, timestamp: number, callback: (tx: StandardTransaction) => void) {
	try {
		evmLogger.debug(`Processing EVM transaction: ${txHash}`);
		const tx = await provider.getTransaction(txHash);
		if (!tx) {
			evmLogger.warn(`Could not retrieve transaction details for ${txHash}`);
			return;
		}

		// Convert to standard format
		const standardTx: StandardTransaction = {
			hash: tx.hash,
			from: tx.from || '',
			to: tx.to,
			value: tx.value ? tx.value.toString() : '0',
			blockNumber: Number(tx.blockNumber),
			timestamp: timestamp,
			chainSpecific: tx // Include full original tx for reference if needed
		};

		evmLogger.debug(`EVM transaction processed: ${tx.hash} (from: ${tx.from}, to: ${tx.to})`);
		callback(standardTx);
	} catch (error) {
		evmLogger.error(`Failed to process EVM transaction ${txHash}: ${error}`);
	}
}


export function getEvmProvider(chain: Chain, connection: ConnectionType): ChainSubscriptionProvider {
	// TODO: Discerne between evm and non-evm chains
	const provider = getClient(Chain.ETHEREUM, connection);
	evmLogger.info(`EVM subscription provider initialized for chain ${chain} with connection type ${connection}`);
	return {
		name: chain,
		type: "evm",
		connection,

		subscribe: async (callback) => {
			evmLogger.info(`Starting EVM block subscription for ${chain}`);
			// We don't need to differentiate between socket and polling here because ethers.js handles it
			provider.on("block", async (blockNumber) => {
				evmLogger.info(`New EVM block detected: ${blockNumber}`);
				const block = await provider.getBlock(blockNumber);
				if (!block || !block.transactions) {
					evmLogger.warn(`Could not retrieve block details for ${blockNumber}`);
					return;
				}

				const timestamp = block.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
				evmLogger.info(`Processing EVM block ${blockNumber} with ${block.transactions.length} transactions`);

				// await Promise.all(block.transactions.map((txHash) => processTransaction(txHash, provider, timestamp, callback)));
				// Running in parallel can cause issues with rate limits, so we run them sequentially, but batching every 20
				// transactions
				for (let i = 0; i < block.transactions.length; i += 2) {
					const batch = block.transactions.slice(i, i + 2);
					await Promise.all(batch.map((txHash) => processTransaction(txHash, provider, timestamp, callback)));
				}
				evmLogger.info(`Finished processing EVM block ${blockNumber}`);
			});
		}
	};
};
