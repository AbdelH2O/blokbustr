import { Blockchain } from "@blokbuster/schema";
// import { NETWORK_API_URLS } from "./constants";
import { getBTCBalance, getERC20Balance, getETHBalance } from "./providers";

/**
 * Get the balance of a wallet
 * @param walletId - The ID of the wallet
 * @param network - The network of the wallet
 * @param tokenAddress - The address of the token contract (optional)
 * @throws Error if the network is not supported
 * @throws Error if the walletId is not a valid address
 * @throws Error if the tokenAddress is not a valid address
 * @returns The balance of the wallet
 */
export async function getWalletBalance(walletId: string, network: Blockchain, tokenAddress?: string) {
    switch (network) {
        case Blockchain.BTC:
            return getBTCBalance(walletId);
		case Blockchain.ETH:
			if (tokenAddress) {
				return getERC20Balance(walletId, tokenAddress);
			}
			return getETHBalance(walletId);
        default:
            throw new Error(`Unsupported network: ${network}`);
    }
}
