import { RedisClientType } from "redis";
import { connectToRedis } from "../dbconfig";

class CacheUtils {
  private client: RedisClientType | undefined;
  constructor() {
    connectToRedis()
      .then((client) => {
        this.client = client;
      })
      .catch((err) => {
        console.error("Failed to connect to Redis:", err);
        throw new Error("Redis connection failed");
      });
  }

  async connectToRedis() {
    if (!this.client) {
      this.client = await connectToRedis();
    }
    return this.client;
  }

  async setCache(key: string, value: any, expiry?: number) {
    if (!this.client) {
      await this.connectToRedis();
    }
    await this.client?.set(key, JSON.stringify(value));
    if (expiry) {
      await this.client?.expire(key, expiry);
    }
  }

  async getCache(key: string): Promise<any | null> {
    if (!this.client) {
      await this.connectToRedis();
    }
    const value = await this.client?.get(key);
    return value ? JSON.parse(value) : null;
  }

  async deleteCache(key: string) {
    if (!this.client) {
      await this.connectToRedis();
    }
    await this.client?.del(key);
  }

  async hasCache(key: string): Promise<boolean> {
    if (!this.client) {
      await this.connectToRedis();
    }
    const exists = await this.client?.exists(key);
    return exists === 1;
  }
}

export const cacheUtils = new CacheUtils();
