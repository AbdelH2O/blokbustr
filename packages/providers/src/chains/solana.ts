import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { ChainProvider, ConnectionType } from "../types";
import { Chain, StandardTransaction } from "@blokbustr/schema";

let lastSlot = 0;

export function getSolanaProvider(_connection: ConnectionType): ChainProvider {
  const conn = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

  return {
    name: Chain.SOLANA,
    type: "non-evm",
    connection: "polling",

    getLatestTransactions: async (callback) => {
      setInterval(async () => {
        try {
          const currentSlot = await conn.getSlot();

          if (currentSlot <= lastSlot) return;
          lastSlot = currentSlot;

          const block = await conn.getBlock(currentSlot, {
            maxSupportedTransactionVersion: 0, 
          });
          
          if (!block || !block.transactions) return;
          
          const timestamp = block.blockTime ? block.blockTime : Math.floor(Date.now() / 1000);
          
          for (const tx of block.transactions) {
            try {
              const transaction = tx.transaction;
              const meta = tx.meta;
              
              if (!transaction || !meta) continue;
              
              // Extract addresses safely
              let fromAddresses: string[] = [];
              
              try {
                // Try to get account keys based on Solana web3.js version
                if (transaction.message.staticAccountKeys) {
                  fromAddresses = transaction.message.staticAccountKeys.map((key: PublicKey) => key.toString());
                } else if (typeof transaction.message.getAccountKeys === 'function') {
                  const keys = transaction.message.getAccountKeys();
                  const addresses = new Array(keys.length).map((_, i) => keys.get(i)?.toString());
				  fromAddresses = addresses.filter((address) => address !== undefined);
                }
              } catch (e) {
                // If we can't extract addresses, use an empty array
                fromAddresses = [];
              }
              
              const signature = transaction.signatures[0]?.toString() || '';
              
              // Convert to standard format
              const standardTx: StandardTransaction = {
                hash: signature,
                from: fromAddresses.length > 0 ? fromAddresses : ['unknown'],
                to: fromAddresses.length > 0 ? fromAddresses[0] : null,
                value: meta.fee.toString(), // Use fee as value for consistency
                blockNumber: currentSlot,
                timestamp: timestamp,
                chainSpecific: {
                  signature,
                  slot: currentSlot,
                  fee: meta.fee,
                  success: meta.err === null
                }
              };
              
              callback(standardTx);
            } catch (error) {
              console.error("Failed to process Solana transaction:", error);
            }
          }
        } catch (error) {
          console.error(`Failed to get Solana block:`, error);
        }
      }, 8000);
    }
  };
}
