import { createClient, RedisClientType } from "redis";

export const redisClient: RedisClientType = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

export async function isWatchedAddress(chain: string, address: string): Promise<boolean> {
  if (!address) return false;
  const key = `watched_addresses:${chain}`;
  return await redisClient.sIsMember(key, address.toLowerCase());
}
