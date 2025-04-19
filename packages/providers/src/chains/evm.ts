import { ethers } from "ethers";
import { ChainProvider, ConnectionType } from "../types";
import { ConnectionProvider } from "../constants";
import { Chain, StandardTransaction } from "@blokbustr/schema";

async function processTransaction(txHash: string, provider: ethers.Provider, timestamp: number, callback: (tx: StandardTransaction) => void) {
	try {
		const tx = await provider.getTransaction(txHash);
		if (!tx) return;

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

		callback(standardTx);
	} catch (error) {
		console.error(`Failed to process EVM transaction ${txHash}:`, error);
	}
}

export function getEvmProvider(chain: Chain, connection: ConnectionType): ChainProvider {
	const provider = connection === "socket"
		? new ethers.WebSocketProvider(ConnectionProvider[chain].socket)
		: new ethers.JsonRpcProvider(ConnectionProvider[chain].polling);

	return {
		name: chain,
		type: "evm",
		connection,

		getLatestTransactions: async (callback) => {
			// We don't need to differentiate between socket and polling here because ethers.js handles it
			provider.on("block", async (blockNumber) => {
				const block = await provider.getBlock(blockNumber);
				if (!block || !block.transactions) return;

				const timestamp = block.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);

				await Promise.all(block.transactions.map((txHash) => processTransaction(txHash, provider, timestamp, callback)));
			});
		}
	};
};
