import { DataSource, DataSourceOptions } from "typeorm";
import { GlobalSettings } from "./globalSettings";
import { createClient, RedisClientType } from "redis";
import { User } from "./entity/user.entity";

const dataStoreOptions: DataSourceOptions = {
  type: "postgres",
  url: GlobalSettings.database.url,
  synchronize: true,
  logging: false,
  entities: [User],
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
