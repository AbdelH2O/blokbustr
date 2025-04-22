import { Chain } from "@blokbustr/schema";
import { ConnectionProvider } from "@/constants.js";
import getEVMClient from "./evm.js";
import getBitcoinClient from "./bitcoin.js";
import getSolanaClient from "./solana.js";
import { RPCClient, ClientInstance } from "@/types.js";

// Keep track of clients to avoid creating multiple instances
const clients: Record<Chain, ClientInstance | null> = {
	[Chain.ETHEREUM]: null,
	[Chain.BITCOIN]: null,
	[Chain.SOLANA]: null,
};

export function getClient<T extends Chain>(chain: T, connection: "polling" | "socket" = "polling"): RPCClient[T] {
	switch (chain) {
		case Chain.ETHEREUM:
			if (!clients[Chain.ETHEREUM]) {
				clients[Chain.ETHEREUM] = getEVMClient(
					ConnectionProvider[Chain.ETHEREUM],
					connection
				);
			}
			return clients[Chain.ETHEREUM] as RPCClient[T];
		case Chain.BITCOIN:
			if (connection === "socket") {
				throw new Error("Socket connection is not supported for Bitcoin");
			}
			if (!clients[Chain.BITCOIN]) {
				clients[Chain.BITCOIN] = getBitcoinClient(
					ConnectionProvider[Chain.BITCOIN]
				);
			}
			return clients[Chain.BITCOIN] as RPCClient[T];
		case Chain.SOLANA:
			if (!clients[Chain.SOLANA]) {
				clients[Chain.SOLANA] = getSolanaClient(
					ConnectionProvider[Chain.SOLANA]
				);
			}
			return clients[Chain.SOLANA] as RPCClient[T];
		default:
			throw new Error(`Unsupported chain: ${chain}`);
	}
}