import {
	getBitcoinProvider,
	getSolanaProvider,
	getEvmProvider
} from "./chains";
import { Chain } from "@blokbustr/schema";
import { ConnectionType, ChainProvider } from "./types";

export function getProvider(chain: Chain, connection: ConnectionType): ChainProvider {
	switch (chain) {
		case Chain.ETHEREUM:
			return getEvmProvider(chain, connection);
		case Chain.BITCOIN:
			return getBitcoinProvider(connection);
		case Chain.SOLANA:
			return getSolanaProvider(connection);
		default:
			throw new Error(`Unsupported chain: ${chain}`);
	}
}
