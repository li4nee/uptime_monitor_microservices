import dotenv from "dotenv";
dotenv.config();
const GlobalSettings = {
  port: Number(4000),
  JWT_SECRET: process.env.JWT_SECRET || "miccheck1212miccheck1212",
  REDIS_URL: process.env.REDIS_URL || "redis://redis:6379",
};

export { GlobalSettings };
