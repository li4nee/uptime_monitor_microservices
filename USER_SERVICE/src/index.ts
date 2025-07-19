import "reflect-metadata";
import { GlobalSettings } from "./globalSettings";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./db.config";
import { GlobalErrorHandler } from "./utility/base.utility";
import { authRouter } from "./modules/user/user.routes";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());
// Routes
app.use("/auth", authRouter);

// app.post('/login', UserController.login)

app.use(GlobalErrorHandler);

app.listen(GlobalSettings.port, () => {
  console.log(`User Service listening on port ${GlobalSettings.port}`);
  AppDataSource.initialize()
    .then(async () => {
      console.log("User Service DB connected");
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        console.log("Running migrations...");
        await AppDataSource.runMigrations();
        console.log("Migrations completed.");
      }
    })
    .catch((error) => console.error("DB connection error:", error));
});
