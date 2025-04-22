import { getEVMHistory, getBitcoinHistory, getSolanaHistory } from '@/chains/history/index.js';

/**
 * Returns the appropriate history fetcher function for the specified chain
 * 
 * @param chain - The blockchain network identifier
 * @returns A function that fetches transactions after a specific transaction
 */
export function getHistoryFetcher(chain: string) {
  switch (chain) {
    case 'ethereum':
      return getEVMHistory;
    case 'bitcoin':
      return getBitcoinHistory;
    case 'solana':
      return getSolanaHistory;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}
