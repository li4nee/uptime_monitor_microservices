import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, RequestHandler, Options, RequestHandler as ProxyRequestHandler } from "http-proxy-middleware";
import dotenv from "dotenv";
import { GlobalSettings } from "./globalSettings";
import { authenticate } from "./middleware/authenticate";
import cookieParser from "cookie-parser";
import { AuthenticatedRequest, CustomError } from "./typings/base.typings";
import { logger } from "./utility/logger.utils";
import * as promClient from "prom-client";
import cors from "cors";
import { initialDocumentation } from "./typings/initialDcoumentation.typings";

dotenv.config();

const app = express();

// Middleware to parse JSON, URL-encoded data and cookies
app.use(cookieParser());

// CORS configuration , have to configure later
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// Proxy configuration for user service and monitor service
app.use(
  "/user",
  createProxyMiddleware({
    target: "http://user-service:3001",
    changeOrigin: true,
    pathRewrite: { "^/user": "" },
    timeout: 5000,
    proxyTimeout: 5000,
    selfHandleResponse: false,
    on: {
      proxyReq: (proxyReq, req: Request, res: Response) => {
        logger.info(`Proxying /user request`, {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          cookies: req.cookies,
          timestamp: new Date().toISOString(),
        });
        return;
      },
      proxyRes: (proxyRes, req: Request, res: Response) => {
        logger.info(`Response from /user service`, {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          timestamp: new Date().toISOString(),
          url: req.originalUrl,
          method: req.method,
        });
      },
      error: (err, req: Request) => {
        logger.error(`Error in /user proxy`, {
          message: err.message,
          stack: err.stack,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
      },
    },
  }),
);

app.use(
  "/monitor",
  authenticate,
  createProxyMiddleware({
    target: "http://monitor-service:3002",
    changeOrigin: true,
    pathRewrite: { "^/monitor": "" },
    selfHandleResponse: false,
    timeout: 5000,
    proxyTimeout: 5000,
    on: {
      proxyReq: (proxyReq, req: AuthenticatedRequest, res: Response) => {
        if (req.userId) {
          logger.info(`Proxying /monitor request`, {
            userId: req.userId,
            role: req.role,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            headers: req.headers,
            cookies: req.cookies,
            timestamp: new Date().toISOString(),
          });
          proxyReq.setHeader("x-user-id-from-proxy", req.userId);
          proxyReq.setHeader("x-user-role-from-proxy", req.role || "user");
        }
      },
      proxyRes: (proxyRes, req: AuthenticatedRequest, res: Response) => {
        logger.info(`Response from /monitor service`, {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          userId: req.userId,
          role: req.role,
          timestamp: new Date().toISOString(),
          url: req.originalUrl,
          method: req.method,
        });
      },
      error: (err, req: AuthenticatedRequest) => {
        logger.error(`Error in /monitor proxy`, {
          message: err.message,
          stack: err.stack,
          userId: req.userId,
          role: req.role,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
      },
    },
  }),
);

// Prometheus metrics endpoint
let collectDefaultMetrix = promClient.collectDefaultMetrics;
collectDefaultMetrix({ register: promClient.register });
app.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = await promClient.register.metrics();
    res.setHeader("Content-Type", promClient.register.contentType);
    res.send(metrics);
    return;
  } catch (error) {
    logger.error("Error fetching metrics", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).send("Error fetching metrics");
    return;
  }
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).send(initialDocumentation);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    logger.error(err.message || "Custom error occured", {
      message: err.message,
      statusCode: err.statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }
  logger.error("Unexpected error occurred", {
    message: err.message || "An unexpected error occurred",
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  res.status(500).json({
    message: "Internal server error",
    statusCode: 500,
  });
  return;
});

app.listen(GlobalSettings.port, (error) => {
  if (!error) logger.info(`API Gateway is running on port ${GlobalSettings.port}`);
  else {
    logger.error(`Error starting API Gateway: ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    process.exit(1);
  }
});
