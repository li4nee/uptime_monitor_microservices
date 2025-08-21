### Uptime Monitoring Backend
A backend system for monitoring website's and it's APIS uptime, sending notifications via Email, Slack, and Discord, and storing metrics for reporting and SLA calculations.

### System Architecture
![Overall architecture](image-2.png)
![Logs and metrics](image-1.png)

### Environment Variables (.env)
Create a .env or .env-development file in the project root with the following configuration:

```env
# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=uptimemonitoringdb
DATABASE_URL=postgres://user:your_password@postgres:5432/uptimemonitoringdb

# JWT
JWT_SECRET=your_jwt_secret

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_EXCHANGE=uptime_monitor

# Email Notification Queue
RABBITMQ_QUEUE_EMAIL=uptime_monitor_queue_email
RABBITMQ_ROUTING_KEY_EMAIL=uptime_monitor_routing_key_email

# Slack Notification Queue
RABBITMQ_QUEUE_SLACK=uptime_monitor_queue_slack
RABBITMQ_ROUTING_KEY_SLACK=uptime_monitor_routing_key_slack

# Discord Notification Queue
RABBITMQ_QUEUE_DISCORD=uptime_monitor_queue_discord
RABBITMQ_ROUTING_KEY_DISCORD=uptime_monitor_routing_key_discord

# Email (SMTP) Settings
MAIL_HOST=smtp.gmail.com
MAIL_USER=youremail@gmail.com
MAIL_PASS=your_email_password
```

### Makefile Commands

This project includes a **Makefile** to simplify Docker and development tasks.

| Command            | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `make up`          | Stop existing containers, rebuild, and start the stack. Cleans unused images. |
| `make down`        | Stop containers and remove unused images.                                   |
| `make restart`     | Restart the stack (equivalent to `make down && make up`).                   |
| `make upwithlogs`  | Start services (dev mode, using `.env-development`) and follow logs for `api-gateway`, `user-service`, `monitor-service`, and `worker`. Stops on `CTRL+C`. |
| `make upwithlogsprod` | Start services in **production mode** (using `docker-compose-prod.yml`) and follow logs. |
| `make lint`        | Run **Prettier** to format all TypeScript files across services.            |

