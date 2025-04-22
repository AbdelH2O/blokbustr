import { ChainSubscriptionProvider, ConnectionType } from "@/types.js";
import { Chain, StandardTransaction } from "@blokbustr/schema";
import { getClient } from "@/clients/index.js";
import { bitcoinLogger, subscriptionLogger } from "@/utils/logger.js";


export function getBitcoinProvider(_connection: ConnectionType): ChainSubscriptionProvider {
	const client = getClient(Chain.BITCOIN, "polling");
	let lastBlockHash: string | null = null;
	bitcoinLogger.info("Bitcoin subscription provider initialized");
	return {
		name: Chain.BITCOIN,
		type: "non-evm",
		connection: "polling",

		subscribe: async (callback) => {
			bitcoinLogger.info("Starting Bitcoin block subscription");
			setInterval(async () => {
				try {
					const bestBlockHash = await client.command("getbestblockhash");

					if (bestBlockHash === lastBlockHash) return;
					bitcoinLogger.debug(`New Bitcoin block detected: ${bestBlockHash}`);
					lastBlockHash = bestBlockHash;

					const block = await client.getBlockByHash(bestBlockHash);
					const blockInfo = await client.command("getblock", bestBlockHash);
					const timestamp = blockInfo.time || Math.floor(Date.now() / 1000);

					bitcoinLogger.info(`Processing Bitcoin block ${block.height} with ${block.tx.length} transactions`);

					for (const txId of block.tx) {
						try {
							// Fetch transaction details
							const txDetails = await client.command("getrawtransaction", txId, 1).catch(() => null);
							
							// Convert to our standard transaction format
							const standardTx: StandardTransaction = {
								hash: txId,
								from: txDetails?.vin?.[0]?.addresses || ['unknown'],
								to: txDetails?.vout?.[0]?.scriptPubKey?.addresses?.[0] || null,
								value: txDetails?.vout?.[0]?.value?.toString() || '0',
								blockNumber: block.height || 0,
								timestamp: timestamp,
								chainSpecific: txDetails // Store original tx for reference
							};
							
							bitcoinLogger.debug(`Bitcoin transaction processed: ${txId}`);
							callback(standardTx);
						} catch (error) {
							// Fallback with minimal information if detailed transaction fetch fails
							bitcoinLogger.warn(`Failed to get full Bitcoin transaction details for ${txId}: ${error}`);
							const standardTx: StandardTransaction = {
								hash: txId,
								from: ['unknown'],
								to: null,
								value: '0',
								blockNumber: block.height || 0,
								timestamp: timestamp,
								chainSpecific: { txid: txId }
							};
							
							callback(standardTx);
							bitcoinLogger.warn(`Limited data for Bitcoin transaction ${txId}`);
						}
					}
				} catch (error) {
					bitcoinLogger.error(`Error in Bitcoin transaction watcher: ${error}`);
				}
			}, 10000);
		}
	};
}
