import { JsonRpcProvider, Contract } from "ethers";

const client = new JsonRpcProvider(process.env.ETHEREUM_FULL_ENDPOINT);

/**
 * Get the balance of an ETH wallet
 * @param walletId - The ID of the wallet
 * @returns The balance of the wallet in wei
 */
export async function getETHBalance(walletId: string) {
	// Check if the walletId is a valid Ethereum address
	if (!/^0x[a-fA-F0-9]{40}$/.test(walletId)) {
		throw new Error("Invalid Ethereum address");
	}
	const balance = await client.getBalance(walletId);
	return balance;
}

/**
 * Get the balance of an ERC20 token wallet
 * @param walletId - The ID of the wallet
 * @param tokenAddress - The address of the token contract
 * @returns The balance of the wallet in wei
 */
export async function getERC20Balance(walletId: string, tokenAddress: string) {
	// Check if the walletId is a valid Ethereum address
	if (!/^0x[a-fA-F0-9]{40}$/.test(walletId)) {
		throw new Error("Invalid Ethereum address");
	}
	// Check if the tokenAddress is a valid Ethereum address
	if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
		throw new Error("Invalid token address");
	}
	const contract = new Contract(tokenAddress, [
		"function balanceOf(address owner) view returns (uint256)",
	], client);
	const balance = await contract.balanceOf(walletId);
	return balance;
}