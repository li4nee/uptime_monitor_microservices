import dotenv from "dotenv";
dotenv.config();
const GlobalSettings = {
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    exchange: process.env.RABBITMQ_EXCHANGE || "uptime_monitor",
    queue: process.env.RABBITMQ_QUEUE || "uptime_monitor_queue",
    routingKey: process.env.RABBITMQ_ROUTING_KEY || "uptime_monitor_routing",
  },
  mail: {
    host: process.env.MAIL_HOST || "smtp.example.com",
    user: process.env.MAIL_USER || "your_email@example.com",
    pass: process.env.MAIL_PASS || "your_email_password",
  },
};

export { GlobalSettings };
