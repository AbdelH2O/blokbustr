import { Chain, StandardTransaction } from "@blokbustr/schema";
import { ethers } from "ethers";

export type ConnectionType = "polling" | "socket";

export interface ChainProvider {
	name: Chain;
	type: "evm" | "non-evm";
	connection: ConnectionType;
  
	getLatestTransactions(callback: (tx: StandardTransaction) => void): Promise<void>;
}
