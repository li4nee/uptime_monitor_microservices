import "reflect-metadata";
import { GlobalSettings } from "./globalSettings";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./dbconfig";
import { GlobalErrorHandler } from "./utils/base.utils";
import { monitorV1Router } from "./modules/monitor_v1/monitorV1.route";
import { attachProxiedUser } from "./middleware/attachUserId.middleware";
import { getMessageBrokerProducer } from "./lib/Broker.lib";
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./swagger.config";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/v1", attachProxiedUser, monitorV1Router);

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Monitor Service is running",
    status: 200,
  });
});

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.use(GlobalErrorHandler);

app.listen(GlobalSettings.port, () => {
  console.log(`Monitor Service listening on port ${GlobalSettings.port}`);
  getMessageBrokerProducer();
  AppDataSource.initialize()
    .then(async () => {
      console.log("Monitor Service DB connected");
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        console.log("Running migrations...");
        await AppDataSource.runMigrations();
        console.log("Migrations completed.");
      }
    })
    .catch((error) => console.error("DB connection error:", error));
});
