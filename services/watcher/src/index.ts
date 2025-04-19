import { getProvider } from "@blokbustr/providers";
import { isWatchedAddress } from "./utils/redis";
import { notifyMatch } from "./utils/notify";
import { getChainDetails } from "./constants";

async function main() {
	const { chain, connection } = getChainDetails();
	const provider = getProvider(chain, connection as "polling" | "socket");

	await provider.getLatestTransactions(async (tx) => {
		const fromAddresses = Array.isArray(tx.from) ? tx.from : [tx.from];
		const toAddresses = tx.to ? [tx.to] : [];
		const allInvolved = [...fromAddresses, ...toAddresses].filter(Boolean);

		for (const addr of allInvolved) {
			if (await isWatchedAddress(chain, addr)) {
				notifyMatch(chain, tx, addr);
				break; // Stop after first match
			}
		}
	});

	console.log(`[${chain}] Watcher started (${connection})`);
}

main().catch((err) => {
	console.error("Unhandled error in watcher:", err);
	process.exit(1);
});
// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log(`Watcher shutting down...`);
	process.exit(0);
});
process.on("SIGTERM", () => {
	console.log(`Watcher shutting down...`);
	process.exit(0);
});
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
});