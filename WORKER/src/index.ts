import { getMessageBrokerConsumer } from "./lib/messageBrokerConsumer";
import { InternalServerError } from "./typings/base.type";
import { logger } from "./utility/logger.utils";
import express from "express";
import * as promClient from "prom-client";
import { Request, Response } from "express";

let app = express();

let collectDefaultMetrix = promClient.collectDefaultMetrics;
collectDefaultMetrix({ register: promClient.register });

// LEFT : add different metrics like no of jobs processed, failed jobs, etc
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
app.listen(3003,"0.0.0.0", (err) => {
  if (err) {
    throw new InternalServerError("Failed to start worker service: " + (err as Error).message);
  }
  logger.info("Worker service is running on port 3003");
  getMessageBrokerConsumer()
    .setupBroker()
    .then(() => {
      logger.info("Worker message broker setup completed successfully.");
    })
    .catch((error) => {
      throw new InternalServerError("Failed to set up worker message broker: " + (error as Error).message);
    });
});
