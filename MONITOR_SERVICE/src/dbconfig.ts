import { DataSource, DataSourceOptions } from "typeorm";
import { createClient, RedisClientType } from "redis";
import { GlobalSettings } from "./globalSettings";
import Redis from "ioredis";
import { Site } from "./entity/site.entity";
import { SiteApi } from "./entity/siteApi.entity";
import { SiteMonitoringHistory } from "./entity/siteMonitoringHistory.entity";
import { siteNotificationSetting } from "./entity/siteNotificationSetting.entity";

const dataStoreOptions: DataSourceOptions = {
  type: "postgres",
  url: GlobalSettings.database.url,
  synchronize: true,
  logging: false,
  entities: [Site,SiteApi,SiteMonitoringHistory,siteNotificationSetting],
  migrations: [__dirname + "/migrations/**/*.{js,ts}"],
  extra: {
    connectionLimit: 25,
    connectTimeout: 60000,
  },
};
export const AppDataSource = new DataSource(dataStoreOptions);

// singleton banaune esari gareko
let redisClient: RedisClientType | null = null;
export const connectToRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: GlobalSettings.redis.url,
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
    throw new Error("Failed to connect to Redis");
  });

  await redisClient.connect();
  return redisClient;
};

export let IoRedisClientForBullMQ = new Redis(GlobalSettings.redis.url,{
  maxRetriesPerRequest: null, // Disable automatic retries
  enableReadyCheck: true, // Enable ready check to ensure the client is ready before use
});
