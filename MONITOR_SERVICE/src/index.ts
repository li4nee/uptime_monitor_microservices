import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { GlobalSettings } from "./globalSettings";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./dbconfig";
import { monitorV1SiteRouter } from "./modules/monitor_v1/site/monitorV1Site.route";
import { attachProxiedUser } from "./middleware/attachUserId.middleware";
import { getMessageBrokerProducer } from "./lib/Broker.lib";
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./swagger.config";
import { GlobalErrorHandler } from "./middleware/globalErrorHandler.middleware";
import { logger } from "./utils/logger.utils";
import * as promClient from "prom-client";
import { scheduleMonitorJob } from "./lib/queue/jobSchedularCron.queue";
import { monitorV1HistoryRouter } from "./modules/monitor_v1/monitoringHistory/monitorV1History.route";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/v1/sites", attachProxiedUser, monitorV1SiteRouter);
app.use("/v1/history", attachProxiedUser, monitorV1HistoryRouter);
app.set("strict routing", true);
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, {
    swaggerOptions: {
      url: "swagger.json",
    },
  }),
);

// Also expose the JSON spec
app.get("/api-docs/swagger.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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

app.use(GlobalErrorHandler);

app.listen(GlobalSettings.port, "0.0.0.0", async () => {
  getMessageBrokerProducer();
  logger.info(`Monitor Service listening on port ${GlobalSettings.port}`);
  AppDataSource.initialize()
    .then(async () => {
      logger.info("Monitor Service DB connected");

      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        logger.info("Running migrations...");
        await AppDataSource.runMigrations();
        logger.info("Migrations completed.");
      }
      // await scheduleMonitorJob();
      // await import("./lib/workers/jobSchedularCron.worker");
      // await import("./lib/workers/SiteMonitorWorker.worker");
      // await import("./lib/workers/SaveMonitoringHistory.worker");
    })
    .catch((error) => {
      logger.error("DB connection error", {
        errorMessage: error.message,
        stack: error.stack,
      });
    });
});
