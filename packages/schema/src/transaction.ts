// Standardized transaction interface that works across all chains
export interface StandardTransaction {
	hash: string;
	from: string | string[];
	to: string | null;
	value: string;
	blockNumber: number;
	timestamp: number;
	chainSpecific?: any; // For any chain-specific data that might be needed
}