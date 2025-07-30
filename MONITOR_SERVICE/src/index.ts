import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { GlobalSettings } from "./globalSettings";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./dbconfig";
import { monitorV1Router } from "./modules/monitor_v1/monitorV1.route";
import { attachProxiedUser } from "./middleware/attachUserId.middleware";
import { getMessageBrokerProducer } from "./lib/Broker.lib";
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./swagger.config";
import { GlobalErrorHandler } from "./middleware/globalErrorHandler.middleware";
import { logger } from "./utils/logger.utils";
import * as promClient from "prom-client";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/v1", attachProxiedUser, monitorV1Router);

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

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

app.listen(GlobalSettings.port,"0.0.0.0", () => {
  logger.info(`Monitor Service listening on port ${GlobalSettings.port}`);
  getMessageBrokerProducer();
  AppDataSource.initialize()
    .then(async () => {
      logger.info("Monitor Service DB connected");

      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        logger.info("Running migrations...");
        await AppDataSource.runMigrations();
        logger.info("Migrations completed.");
      }
    })
    .catch((error) => {
      logger.error("DB connection error", {
        errorMessage: error.message,
        stack: error.stack,
      });
    });
});
