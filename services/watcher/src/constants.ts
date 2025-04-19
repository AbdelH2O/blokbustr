import { Chain } from "@blokbustr/schema";

export function getChainDetails() {
	const chain = process.env.WATCHER_CHAIN;
	if (!chain || !Object.values(Chain).includes(chain as Chain)) {
		throw new Error("Invalid or missing WATCHER_CHAIN environment variable.");
	}
	const connection = process.env.SOCKET_CONNECTION ? "socket" : "polling";
	return {
		chain: chain as Chain,
		connection,
	};
}