import { ConnectionProvider } from "@/constants.js";
import { Connection } from "@solana/web3.js";

export default function getSolanaClient(
	connection: typeof ConnectionProvider["SOLANA"],
) {
	return new Connection(connection.polling, {
		commitment: "confirmed",
		disableRetryOnRateLimit: true,
		wsEndpoint: connection.socket,
	});
}