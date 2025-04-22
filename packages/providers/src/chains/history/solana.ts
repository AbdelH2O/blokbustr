import { Connection, PublicKey } from '@solana/web3.js';
import { StandardTransaction } from '@blokbustr/schema';

const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/**
 * Fetches Solana transaction history after a specified transaction
 * 
 * @param address - The address to get transactions for
 * @param fromTxHash - The transaction hash/signature to start from (optional)
 * @returns An array of transactions that occurred after the specified transaction
 */
export async function getSolanaHistory(
	address: string,
	fromTxHash?: string
): Promise<StandardTransaction[]> {
	const connection = new Connection(SOLANA_RPC, 'confirmed');
	const pubkey = new PublicKey(address);

	// Fetch up to 1000 signatures
	const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });

	// If no transaction hash is provided, use all signatures
	let filteredSignatures = signatures;
	
	// If a transaction hash is provided, find all transactions after it
	if (fromTxHash) {
		// Find the reference transaction in the list
		const refTxIndex = signatures.findIndex(sig => sig.signature === fromTxHash);
		
		if (refTxIndex !== -1) {
			// Use all transactions that come after the reference transaction in the list
			// (Note that signatures are returned in reverse chronological order)
			filteredSignatures = signatures.slice(refTxIndex + 1);
		} else {
			// If the transaction wasn't found in the first batch, we need to
			// fetch the transaction to get its block time
			try {
				const refTx = await connection.getParsedTransaction(fromTxHash, {
					commitment: 'confirmed',
					maxSupportedTransactionVersion: 0,
				});
				
				if (!refTx || !refTx.blockTime) {
					throw new Error(`Cannot find reference transaction ${fromTxHash}`);
				}
				
				// Filter by block time
				const fromTimestamp = refTx.blockTime;
				filteredSignatures = signatures.filter(sig => sig.blockTime && sig.blockTime > fromTimestamp);
			} catch (error) {
				console.error(`Error fetching transaction ${fromTxHash}:`, error);
				throw new Error(`Could not find transaction ${fromTxHash}`);
			}
		}
	}

	// Fetch and process the transactions
	const txs: (StandardTransaction | null)[] = (await connection.getParsedTransactions(
		filteredSignatures.map(sig => sig.signature),
		{
			commitment: 'confirmed',
			maxSupportedTransactionVersion: 0,
		}
	)).map((tx, index) => {
		if (!tx || !tx.meta || !tx.blockTime) return null;
		const keys = tx.transaction.message.accountKeys;
		if (!keys) return null;
		// Extract from and to addresses
		const fromAddresses = [];
		let toAddress = null;
		for (const key of keys) {
			if (tx.transaction.signatures.includes(key.toString())) {
				fromAddresses.push(key.toString());
			} else {
				toAddress = key.toString();
			}
		}
		return {
			hash: tx.transaction.signatures[0],
			from: fromAddresses.length > 0 ? fromAddresses : ['unknown'],
			to: toAddress || 'unknown',
			value: (tx.meta.preBalances[0] - tx.meta.postBalances[0]).toString(), // Use balance difference as value
			blockNumber: tx.slot,
			timestamp: tx.blockTime,
			chainSpecific: tx, // Include full original tx for reference if needed
		};
	});
	// Filter out null transactions
	const filteredTxs = txs.filter((tx): tx is StandardTransaction => tx !== null);
	return filteredTxs;
}
