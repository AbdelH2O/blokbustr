import { ExplorationTask } from './types.js';
import { getHistoryFetcher } from '@blokbustr/providers';
import { enqueueTask } from './utils.js'; // hypothetical queue function
import { StandardTransaction } from '@blokbustr/schema';

const MAX_DEPTH = 5;

export async function explore(task: ExplorationTask): Promise<void> {
  const { address, startTx, amountToTrack, chain, depth = 0 } = task;

  if (depth > MAX_DEPTH) {
    console.log(`Max depth reached for ${address}`);
    return;
  }

  console.log(`Exploring ${address} on ${chain} (depth ${depth})...`);

  const fetcher = getHistoryFetcher(chain);
  const transactions: StandardTransaction[] = await fetcher(address, startTx);

  for (const tx of transactions) {
    if (!tx.to || tx.to === address) continue;

    // Basic condition: forward the transaction if value is significant
    const value = BigInt(tx.value);
    if (value === BigInt(0)) continue;

    const newAmount = value.toString();

    const nextTask: ExplorationTask = {
      address: tx.to,
      startTx: tx.hash,
      amountToTrack: newAmount,
      chain,
      depth: depth + 1,
    };

    await enqueueTask(nextTask);
  }
}
