import { createClient, RedisClientType } from "redis";
import { GlobalSettings } from "./globalSettings";

// singleton banaune esari gareko
let redisClient: RedisClientType | null = null;
export const connectToRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: GlobalSettings.REDIS_URL,
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
    throw new Error("Failed to connect to Redis");
  });

  await redisClient.connect();
  return redisClient;
};
