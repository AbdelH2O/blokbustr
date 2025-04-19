import { Chain } from "@blokbustr/schema";

export const ConnectionProvider: Record<Chain, { socket: string; polling: string; }> = {
	ETHEREUM: {
		socket: process.env.ETHEREUM_SOCKET!,
		polling: process.env.ETHEREUM_FULL_ENDPOINT!,
	},
	BITCOIN: {
		socket: process.env.BITCOIN_SOCKET!,
		polling: process.env.BITCOIN_FULL_ENDPOINT!,
	},
	SOLANA: {
		socket: process.env.SOLANA_SOCKET!,
		polling: process.env.SOLANA_FULL_ENDPOINT!,
	},
};
