import dotenv from "dotenv";
import e from "express";
dotenv.config();
const GlobalSettings = {
  database: {
    url: process.env.DATABASE_URL,
  },
  port: Number(3001),
  JWT_SECRET: process.env.JWT_SECRET || "miccheck1212miccheck1212",
  JWT_EXPIRY: process.env.JWT_EXPIRY || "1h",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "30d",
  redis: {
    url: process.env.REDIS_URL || "redis://redis:6379",
  },
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || "amqp://rabbitmq",
    exchange: process.env.RABBITMQ_EXCHANGE || "uptime_monitor",
    queueEmail: process.env.RABBITMQ_QUEUE_EMAIL || "uptime_monitor_queue_email",
    routingKeyEmail: process.env.RABBITMQ_ROUTING_KEY_EMAIL || "uptime_monitor_routing_key_email",
  },
};

export { GlobalSettings };
