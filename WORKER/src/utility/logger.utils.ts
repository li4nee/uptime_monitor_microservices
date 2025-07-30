import { createLogger, format } from "winston";
import LokiTransport from "winston-loki";
import winston from "winston";


const options = {
  defaultMeta: { service: "WORKER" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  transports: [
    new LokiTransport({
      host: "http://127.0.0.1:3100",
      json: true,
      labels: { app: "WORKER" },
      interval: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.prettyPrint(),
      ),
    }),
  ],
};
export const logger = createLogger(options);
