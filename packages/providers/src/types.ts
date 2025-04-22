import { Chain, StandardTransaction } from "@blokbustr/schema";
import { Connection } from "@solana/web3.js";
import Client from "bitcoin-core";
import { ethers } from "ethers";

export type ConnectionType = "polling" | "socket";

export interface ChainSubscriptionProvider {
	name: Chain;
	type: "evm" | "non-evm";
	connection: ConnectionType;
  
	subscribe(callback: (tx: StandardTransaction) => void): Promise<void>;
}

export interface WalletTransactionFetcher {
	getTransactionsForAddress: (
	  address: string,
	  fromTimestamp: number
	) => Promise<StandardTransaction[]>;
  }
  

export type RPCClient = {
	[Chain.ETHEREUM]: ethers.JsonRpcProvider | ethers.WebSocketProvider;
	[Chain.BITCOIN]: Client
	[Chain.SOLANA]: Connection;
};

export type ClientInstance = RPCClient[keyof RPCClient];