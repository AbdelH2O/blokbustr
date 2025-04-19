;import { ChainProvider, ConnectionType } from "../types";
import { Chain, StandardTransaction } from "@blokbustr/schema";
import { ConnectionProvider } from "../constants";
import Client from "bitcoin-core";

const client = new Client({
	host: ConnectionProvider[Chain.BITCOIN].polling,
	allowDefaultWallet: true,
});

let lastBlockHash: string | null = null;

export function getBitcoinProvider(_connection: ConnectionType): ChainProvider {
	return {
		name: Chain.BITCOIN,
		type: "non-evm",
		connection: "polling",

		getLatestTransactions: async (callback) => {
			setInterval(async () => {
				try {
					const bestBlockHash = await client.command("getbestblockhash");

					if (bestBlockHash === lastBlockHash) return;
					lastBlockHash = bestBlockHash;

					const block = await client.getBlockByHash(bestBlockHash);
					const blockInfo = await client.command("getblock", bestBlockHash);
					const timestamp = blockInfo.time || Math.floor(Date.now() / 1000);

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
							
							callback(standardTx);
						} catch (error) {
							// Fallback with minimal information if detailed transaction fetch fails
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
							console.error(`Note: Limited data for Bitcoin transaction ${txId}`);
						}
					}
				} catch (error) {
					console.error("Error in Bitcoin transaction watcher:", error);
				}
			}, 10000);
		}
	};
}
