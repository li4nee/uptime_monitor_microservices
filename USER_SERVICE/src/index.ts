import "reflect-metadata";
import { GlobalSettings } from "./globalSettings";
import { Request, Response, NextFunction } from "express";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./db.config";
import { authRouter } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./swagger.config";
import { GlobalErrorHandler } from "./middleware/globalErrorHandler.middleware";
import { logger } from "./utility/logger.utils";
import * as promClient from "prom-client";
dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRouter);

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

app.listen(GlobalSettings.port, () => {
  logger.info(`User Service is running on port ${GlobalSettings.port}`);
  AppDataSource.initialize()
    .then(async () => {
      logger.info("Database connection established successfully in User Service");
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        logger.info("Running migrations in User Service...");
        await AppDataSource.runMigrations();
        logger.info("Migrations completed successfully in User Service");
      }
    })
    .catch((error) => logger.error("Error during Data Source initialization in User Service:", error));
});
