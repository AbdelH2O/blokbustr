import Client from "bitcoin-core";
import { ConnectionProvider } from "@/constants.js";

export default function getBitcoinClient(
	connection: typeof ConnectionProvider["BITCOIN"],
) {
	return new Client({
		host: connection.polling,
	});
}