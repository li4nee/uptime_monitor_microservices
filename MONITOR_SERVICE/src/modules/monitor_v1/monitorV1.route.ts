import { Router } from "express";
import { Wrapper } from "../../utils/base.utils";
import { MonitorController } from "./monitorV1.controller";
const monitorV1Router = Router();

monitorV1Router.post(
  "/register",
  Wrapper(MonitorController.registerSiteMonitor.bind(MonitorController)),
);
monitorV1Router.get("/routes", Wrapper(MonitorController.getRoutes.bind(MonitorController)));
monitorV1Router.get(
  "/history",
  Wrapper(MonitorController.getMonitoringHistory.bind(MonitorController)),
);
monitorV1Router.get(
  "/overview",
  Wrapper(MonitorController.getOneMonthOverview.bind(MonitorController)),
);

export { monitorV1Router };
