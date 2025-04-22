import { ethers } from "ethers";
import { ConnectionProvider } from "@/constants.js";

export default function getEVMClient(
  connection: typeof ConnectionProvider["ETHEREUM"],
  type: "polling" | "socket"
){
	if (type === "socket") {
		return new ethers.WebSocketProvider(connection.socket);
	}
	return new ethers.JsonRpcProvider(connection.polling);
}
