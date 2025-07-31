export const initialDocumentation = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Gateway - Overview & Documentation</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #f9fafb;
        color: #333;
        max-width: 900px;
        margin: 40px auto;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      }
      h1 {
        color: #1a202c;
        font-size: 2.2rem;
        margin-bottom: 1rem;
      }
      h2 {
        color: #2d3748;
        margin-top: 3rem;
        margin-bottom: 0.8rem;
        font-size: 1.5rem;
      }
      p {
        line-height: 1.6;
        margin-bottom: 1rem;
      }
      code {
        background: #edf2f7;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.95em;
        font-family: Consolas, monospace;
      }
      ul {
        margin-top: 0.5rem;
        padding-left: 20px;
      }
      li {
        margin-bottom: 0.6rem;
      }
      a {
        color: #3182ce;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .note {
        font-size: 0.9rem;
        color: #718096;
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <h1>🔐 API Gateway - Central Access Point</h1>
    <p>
      Welcome! This API Gateway is the unified front door to our backend ecosystem, responsible for routing client requests, managing authentication, collecting logs, and aggregating API documentation from all services.
    </p>

    <h2>🧩 Microservices Overview</h2>
    <p>Our platform is built on a microservices foundation, with the following core components:</p>
    <ul>
      <li>
        <strong>API Gateway:</strong> Handles incoming requests, forwards them to the appropriate services, manages centralized logging, authentication, and consolidates Swagger API documentation.
      </li>
      <li>
        <strong>User Service:</strong> Manages user lifecycle features including registration, login, profiles, and authentication workflows.
      </li>
      <li>
        <strong>Monitor Service:</strong> Performs regular uptime checks on monitored sites and records availability data, providing historical insights into downtime events.
      </li>
      <li>
        <strong>Worker Service:</strong> Acts as a background task processor, leveraging <code>RabbitMQ</code> for message brokering and <code>BullMQ</code> for scalable job processing. It handles asynchronous workloads like email delivery, notifications, and data persistence.
      </li>
    </ul>

    <h2>📚 API Documentation</h2>
    <p>Every HTTP-facing service provides Swagger documentation accessible via:</p>
    <ul>
      <li><a href="/user/api-docs/" target="_blank" rel="noopener">User Service API Docs</a></li>
      <li><a href="/monitor/api-docs/" target="_blank" rel="noopener">Monitor Service API Docs</a></li>
    </ul>
    <p class="note">
      The Worker Service runs purely background processes and does not expose any Swagger UI.
    </p>

    <h2>⚡ Asynchronous Task Processing & Messaging</h2>
    <p>
      Communication between services follows a <strong>publish-subscribe (pub-sub) pattern</strong> facilitated by <code>RabbitMQ</code>. This decouples services and enables scalable, resilient workflows.
    </p>
    <ul>
      <li>
        All services send email requests to the Worker Service via RabbitMQ, centralizing email handling.
      </li>
      <li>
        Notifications such as Discord and Slack pings are also published to RabbitMQ queues, with the Worker Service responsible for delivering these asynchronously.
      </li>
      <li>
        The Monitor Service dispatches uptime check jobs through BullMQ queues managed by the workers inside the monitor service. This allows horizontal scaling by spawning multiple workers (“cores”) that perform checks in parallel.
      </li>
      <li>
        Once checks complete, results are asynchronously persisted to the database via separate BullMQ queues, ensuring efficient non-blocking operations.
      </li>
    </ul>

    <h2>🛠 Technology Stack</h2>
    <p>Our services are built with a focus on modern, scalable tools:</p>
    <ul>
      <li><code>TypeScript</code> provides strong typing and safer code.</li>
      <li><code>Express.js</code> powers RESTful APIs with simplicity and speed.</li>
      <li><code>PostgreSQL</code> serves as a reliable relational data store.</li>
      <li><code>RabbitMQ</code> orchestrates event-driven communication between microservices.</li>
      <li><code>BullMQ</code> enables efficient, horizontally scalable background job processing.</li>
      <li><code>Prometheus</code> collects metrics to monitor system health and performance.</li>
      <li><code>Winston,Winston-loki</code> centralized logging</li>
      <li><code>Swagger UI</code> offers interactive, developer-friendly API documentation.</li>
    </ul>

    <h2>📊 Centralized Logging & Monitoring</h2>
    <p>
      Logs from all microservices flow through the API Gateway into a centralized pipeline. This unified logging approach:
    </p>
    <ul>
      <li>Facilitates quick troubleshooting across distributed services.</li>
      <li>Improves observability by aggregating events, errors, and metrics.</li>
      <li>Integrates seamlessly with tools like Grafana and Kibana for visualization and alerting.</li>
    </ul>

    <h2>📝 Developer Guidelines</h2>
    <p>
      - Always ensure all microservices are running before accessing their documentation.<br/>
      - Keep API annotations current to maintain accurate Swagger docs.<br/>
      - Logs and metrics pipeline flows through this gateway, so monitor the gateway health as well.<br/>
      - Leverage the pub-sub architecture to build loosely coupled, scalable features.
    </p>
    <h2>🚢 Containerization & Deployment</h2>
<p>
  All services run inside Docker containers, orchestrated via <code>docker-compose</code> for easy setup, scaling, and networking. Here's an overview of the container ecosystem:
</p>
<ul>
  <li><strong>Databases & Brokers:</strong> PostgreSQL stores relational data; RabbitMQ handles messaging queues; Redis acts as a caching layer.</li>
  <li><strong>Monitoring & Logging:</strong> Prometheus collects metrics, Grafana visualizes them, and Loki centralizes logs.</li>
  <li><strong>Service Containers:</strong> The API Gateway, User Service, Monitor Service, and Worker Service each run in separate containers, communicating over Docker networks.</li>
  <li><strong>Volumes:</strong> Persistent storage for PostgreSQL, RabbitMQ, and Redis is managed via mounted volumes to preserve data across container restarts.</li>
  <li><strong>Networks:</strong> Services communicate over two Docker networks — an <code>internal</code> network for backend traffic and a <code>public</code> network exposing select services externally.</li>
  <li><strong>Dependencies:</strong> Containers are configured to wait for dependencies (like databases and brokers) to be ready before starting, ensuring smooth startup order.</li>
  <li><strong>Configuration:</strong> Environment variables (e.g., database URLs, RabbitMQ credentials, mail server settings) are injected into containers for flexible and secure configuration.</li>
</ul>
<p>
  This containerized architecture promotes portability, isolation, and simplified deployment across environments.
</p>
  </body>
</html>
`;
