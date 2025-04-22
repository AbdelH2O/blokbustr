import { PublicKey } from "@solana/web3.js";
import { getClient } from "@/clients/index.js";
import { ChainSubscriptionProvider, ConnectionType } from "@/types.js";
import { Chain, StandardTransaction } from "@blokbustr/schema";
import { solanaLogger, subscriptionLogger } from "@/utils/logger.js";


export function getSolanaProvider(connection: ConnectionType): ChainSubscriptionProvider {
	const conn = getClient(Chain.SOLANA, "socket");
	let lastSlot = 0;
  solanaLogger.info("Solana subscription provider initialized");
  return {
    name: Chain.SOLANA,
    type: "non-evm",
    connection,

    subscribe: async (callback) => {
      solanaLogger.info("Starting Solana block subscription");
      setInterval(async () => {
        try {
          const currentSlot = await conn.getSlot();

          if (currentSlot <= lastSlot) return;
          solanaLogger.debug(`New Solana slot detected: ${currentSlot}`);
          lastSlot = currentSlot;

          const block = await conn.getBlock(currentSlot, {
            maxSupportedTransactionVersion: 0, 
          });
          
          if (!block || !block.transactions) {
            solanaLogger.warn(`Could not retrieve block details for slot ${currentSlot}`);
            return;
          }
          
          const timestamp = block.blockTime ? block.blockTime : Math.floor(Date.now() / 1000);
          solanaLogger.info(`Processing Solana block at slot ${currentSlot} with ${block.transactions.length} transactions`);
          
          for (const tx of block.transactions) {
            try {
              const transaction = tx.transaction;
              const meta = tx.meta;
              
              if (!transaction || !meta) {
                solanaLogger.warn("Skipping transaction with missing data");
                continue;
              }
              
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
                solanaLogger.warn(`Failed to extract addresses from transaction: ${e}`);
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
              
              solanaLogger.debug(`Solana transaction processed: ${signature}`);
              callback(standardTx);
            } catch (error) {
              solanaLogger.error(`Failed to process Solana transaction: ${error}`);
            }
          }
        } catch (error) {
          solanaLogger.error(`Failed to get Solana block: ${error}`);
        }
      }, 8000);
    }
  };
}
