import { getClient } from '@/clients/index.js';
import { Chain, StandardTransaction } from '@blokbustr/schema';
import { ethers } from 'ethers';

/**
 * Fetches EVM transaction history after a specified transaction
 * 
 * @param address - The address to get transactions for
 * @param fromTxHash - The transaction hash to start from
 * @returns An array of transactions that occurred after the specified transaction
 */
export async function getEVMHistory(
  address: string,
  fromTxHash?: string
): Promise<StandardTransaction[]> {
  const provider = getClient(Chain.ETHEREUM, 'socket') as ethers.JsonRpcProvider | ethers.WebSocketProvider;
  
  // If no transaction hash is provided, return recent transactions
  if (!fromTxHash) {
    const history = await provider.send('alchemy_getAssetTransfers', [{
      fromBlock: '0x0',
      fromAddress: address,
      category: ['external'],
    }]);

    return history.transfers.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value || '0',
      blockNumber: parseInt(tx.blockNum, 16),
      timestamp: tx.metadata.blockTimestamp,
      chainSpecific: tx, // optionally include full raw tx
    }));
  }

  // Get the transaction details for the given hash
  const tx = await provider.getTransaction(fromTxHash);
  if (!tx) {
    throw new Error(`Transaction ${fromTxHash} not found`);
  }

  // Get the block information to determine timestamp and block number
  const block = await provider.getBlock(tx.blockNumber!);
  const fromBlockNumber = tx.blockNumber;
  if (!block || !fromBlockNumber) {
    throw new Error(`Block for transaction ${fromTxHash} not found`);
  }


  // Fetch transactions after the specified block
  const history = await provider.send('alchemy_getAssetTransfers', [{
    fromBlock: ethers.toBeHex(fromBlockNumber),
    fromAddress: address,
    category: ['external'],
  }]);

  return history.transfers
    .filter((tx: any) => {
      const txBlockNumber = parseInt(tx.blockNum, 16);
      // Include only transactions in later blocks, or in the same block but after our reference tx
      return txBlockNumber > fromBlockNumber || 
        (txBlockNumber === fromBlockNumber && tx.hash !== fromTxHash);
    })
    .map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value || '0',
      blockNumber: parseInt(tx.blockNum, 16),
      timestamp: tx.metadata.blockTimestamp,
      chainSpecific: tx, // optionally include full raw tx
    }));
}
