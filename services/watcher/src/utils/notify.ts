import { Chain, StandardTransaction } from "@blokbustr/schema";

export function notifyMatch(chain: Chain, tx: StandardTransaction, address: string) {
	console.log(`[${chain}] MATCH for ${address}: ${tx.hash || tx.blockNumber} - ${tx.from} -> ${tx.to} (${tx.value})`);
	// TODO: Add webhook or database log here
  }
  