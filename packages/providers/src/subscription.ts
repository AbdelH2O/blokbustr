import {
	getBitcoinProvider,
	getSolanaProvider,
	getEvmProvider
} from "@/chains/subscription/index.js";
import { Chain } from "@blokbustr/schema";
import { ConnectionType, ChainSubscriptionProvider } from "@/types.js";
import { subscriptionLogger } from "@/utils/logger.js";

export function getSubscriptionProvider(chain: Chain, connection: ConnectionType): ChainSubscriptionProvider {
	subscriptionLogger.info(`Creating subscription provider for chain ${chain} with connection type ${connection}`);
	switch (chain) {
		case Chain.ETHEREUM:
			return getEvmProvider(chain, connection);
		case Chain.BITCOIN:
			return getBitcoinProvider(connection);
		case Chain.SOLANA:
			return getSolanaProvider(connection);
		default:
			subscriptionLogger.error(`Unsupported chain: ${chain}`);
			throw new Error(`Unsupported chain: ${chain}`);
	}
}
