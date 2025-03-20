import { Blockchain } from "@blokbuster/schema";
// import { NETWORK_API_URLS } from "../constants";
import Client from "bitcoin-core";

const client = new Client({
	host: process.env.BITCOIN_ENDPOINT,
	username: process.env.BITCOIN_USERNAME,
	password: process.env.BITCOIN_PASSWORD,
});

/**
 * Get the balance of a BTC wallet
 * @param walletId - The ID of the wallet
 * @returns The balance of the wallet in satoshis
 */
export async function getBTCBalance(walletId: string) {
	const balance = await client.command({
		
	})
}