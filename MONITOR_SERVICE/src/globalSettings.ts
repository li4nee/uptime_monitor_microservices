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
    url: process.env.RABBITMQ_URL || "amqp://rabbitmq",
    exchange: process.env.RABBITMQ_EXCHANGE || "uptime_monitor",
    queueEmail: process.env.RABBITMQ_QUEUE || "uptime_monitor_queue_email",
    queueSlack: process.env.RABBITMQ_QUEUE_SLACK || "uptime_monitor_queue_slack",
    queueDiscord: process.env.RABBITMQ_QUEUE_DISCORD || "uptime_monitor_queue_discord",
    routingKeyEmail: process.env.RABBITMQ_ROUTING_KEY_EMAIL || "uptime_monitor_routing_key_email",
    routingKeySlack: process.env.RABBITMQ_ROUTING_KEY_SLACK || "uptime_monitor_routing_key_slack",
    routingKeyDiscord:
      process.env.RABBITMQ_ROUTING_KEY_DISCORD || "uptime_monitor_routing_key_discord",
  },
  mail: {
    host: process.env.MAIL_HOST || "smtp.example.com",
    user: process.env.MAIL_USER || "user@example.com",
    pass: process.env.MAIL_PASS || "password",
  },
};

console.log("Global Settings Loaded:", GlobalSettings);

export { GlobalSettings };
