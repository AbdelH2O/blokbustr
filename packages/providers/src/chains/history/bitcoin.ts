import { StandardTransaction } from '@blokbustr/schema';

/**
 * Fetches Bitcoin transaction history after a specified transaction
 * 
 * @param address - The address to get transactions for
 * @param fromTxHash - The transaction hash to start from (optional)
 * @returns An array of transactions that occurred after the specified transaction
 */
export async function getBitcoinHistory(
	address: string,
	fromTxHash?: string,
): Promise<StandardTransaction[]> {
	const txs = [];
	
	// If a transaction hash is provided, we need to find its details first
	let startBlock = 0;
	let fromTimestamp = 0;
	
	if (fromTxHash) {
		try {
			// Get the transaction details to find its block and timestamp
			const txResponse = await fetch(
				`https://blockstream.info/api/tx/${fromTxHash}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
			
			if (!txResponse.ok) {
				throw new Error(`Failed to fetch transaction ${fromTxHash}`);
			}
			
			const txData = await txResponse.json();
			fromTimestamp = txData.status.block_time;
			startBlock = txData.status.block_height;
		} catch (error) {
			console.error(`Error fetching transaction ${fromTxHash}:`, error);
			throw new Error(`Could not find transaction ${fromTxHash}`);
		}
	}
	
	let before = 0;
	// Keep fetching transactions
	while (true) {
		const txsResponse = await fetch(
			`https://blockstream.info/api/address/${address}/txs/${before}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
		const txsData = await txsResponse.json();
		if (!txsData || !Array.isArray(txsData)) {
			throw new Error('Invalid response from Blockstream API');
		}
		txs.push(...txsData);
		if (txsData.length === 0 || (fromTxHash && txsData[txsData.length - 1].time < fromTimestamp)) {
			break;
		}
		before += txsData.length;
	}

	// Process the transactions
	let filteredTxs = txs;
	
	// If we're looking for transactions after a specific tx hash
	if (fromTxHash) {
		// Find the index of the transaction with the given hash
		const refTxIndex = txs.findIndex((tx: any) => tx.txid === fromTxHash);
		
		if (refTxIndex !== -1) {
			// Keep transactions that come after the reference transaction
			filteredTxs = txs.slice(0, refTxIndex);
		} else {
			// If transaction not found in the list, filter by block height and timestamp
			filteredTxs = txs.filter((tx: any) => 
				(tx.status.block_height > startBlock) || 
				(tx.status.block_height === startBlock && tx.time > fromTimestamp)
			);
		}
	}
	
	return filteredTxs
		.filter((tx: any) => tx.inputs.some((i: any) => i.address === address))
		.map((tx: any) => ({
			hash: tx.txid,
			from: tx.inputs.map((i: any) => i.address),
			to: tx.outputs.find((o: any) => o.address !== address)?.address || null,
			value: tx.outputs
				.filter((o: any) => o.address !== address)
				.reduce((sum: number, o: any) => sum + o.value, 0)
				.toString(),
			blockNumber: tx.blockheight || tx.status.block_height,
			timestamp: tx.time || tx.status.block_time,
			chainSpecific: {},
		}));
}
