import { consumeQueue } from './utils.js';
import { explore } from './explorer.js';
import { ExplorationTask } from './types.js';

const QUEUE_URL = process.env.EXPLORER_QUEUE_URL!;

export async function startConsumer() {
  await consumeQueue<ExplorationTask>(QUEUE_URL, async (task) => {
    try {
      await explore(task);
    } catch (err) {
      console.error(`Failed to explore ${task.address}:`, err);
    }
  });
}
