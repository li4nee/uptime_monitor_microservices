import dotenv from "dotenv";
dotenv.config();
const GlobalSettings = {
  database: {
    url: process.env.DATABASE_URL,
  },
  port: Number(3001),
  redis: {
    url: process.env.REDIS_URL || "redis://redis:6379",
  },
};

export { GlobalSettings };
