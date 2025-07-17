import * as jwt from "jsonwebtoken";
import { GlobalSettings } from "../globalSettings";
import { PermissionNotGranted, UserToken } from "../typings/base.typings";
import { RedisClientType } from "redis";
import { connectToRedis } from "../db.config";

class LoginGlobalStore {
  login_hash = "login_store";
  private secret: string = GlobalSettings.JWT_SECRET || "miccheck1212miccheck1212";
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
  private validateToken = (token: string): UserToken | undefined => {
    try {
      return jwt.verify(token, this.secret) as UserToken;
    } catch (err) {
      return undefined;
    }
  };

  private setToken = async (hash: string, userId: string, token: string, expiry?: number) => {
    const key = `${hash}:${userId}`;
    await this.client?.sAdd(key, token);
    if (expiry) await this.client?.expire(key, expiry);
  };

  private getToken = async (hash: string, userId: string) => {
    const key = `${hash}:${userId}`;
    const exists = await this.client?.exists(key);
    if (!exists) return { found: false, tokens: [] };
    const tokens = await this.client?.sMembers(key); // sab token dincha esle
    return { found: true, tokens };
  };

  private removeToken = async (hash: string, userId: string, token: string) => {
    const key = `${hash}:${userId}`;
    const removed = await this.client?.sRem(key, token);
    const remaining = await this.client?.sCard(key); // Kati ota remaining tokens cha tesko count dincha esle
    if (remaining === 0) await this.client?.del(key);
    return removed === 1;
  };

  removeuserToken = async (userId: string, token: string) => {
    return await this.removeToken(this.login_hash, userId, token);
  };

  verifyuserToken = async (token: string) => {
    if (!token) throw new PermissionNotGranted("userToken not found");
    let verify = this.validateToken(token);
    if (!verify) return undefined;
    let { found, tokens } = await this.getToken(this.login_hash, verify.userId);
    if (!found) throw new PermissionNotGranted("user expired");
    if (!tokens || tokens.length === 0) throw new PermissionNotGranted("user expired");
    if (!found || tokens.indexOf(token) <= -1) throw new PermissionNotGranted("user expired");
    return verify;
  };

  setuserToken = async (token: string, userId: string, time: number) => {
    await this.setToken(this.login_hash, userId, token, time);
  };
}

export const LoginStore = new LoginGlobalStore();
