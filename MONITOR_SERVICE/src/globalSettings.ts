import dotenv from "dotenv";
dotenv.config();
const GlobalSettings = {
  database: {
    url: process.env.DATABASE_URL,
  },
  port: Number(3002),
  redis: {
    url: process.env.REDIS_URL || "redis://redis:6379",
  },
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    exchange: process.env.RABBITMQ_EXCHANGE || "uptime_monitor",
    queue: process.env.RABBITMQ_QUEUE || "uptime_monitor_queue",
    routingKey: process.env.RABBITMQ_ROUTING_KEY || "uptime_monitor_routing",
  },
};

export { GlobalSettings };
