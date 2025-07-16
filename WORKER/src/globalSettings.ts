import dotenv from "dotenv";
dotenv.config();
const GlobalSettings = {
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    exchange: process.env.RABBITMQ_EXCHANGE || "uptime_monitor",
    queue: process.env.RABBITMQ_QUEUE || "uptime_monitor_queue",
    routingKey: process.env.RABBITMQ_ROUTING_KEY || "uptime_monitor_routing",
  },
};

export { GlobalSettings };
