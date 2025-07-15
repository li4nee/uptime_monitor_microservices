import { Router } from "express";
import { Wrapper } from "../../utils/base.utils";
import { MonitorController } from "./monitor.controller";
const monitorRouter = Router();

monitorRouter.post(
  "/register",
  Wrapper(MonitorController.registerSiteMonitor.bind(MonitorController)),
);
monitorRouter.get("/routes", Wrapper(MonitorController.getRoutes.bind(MonitorController)));
monitorRouter.get(
  "/history",
  Wrapper(MonitorController.getMonitoringHistory.bind(MonitorController)),
);
monitorRouter.get(
  "/overview",
  Wrapper(MonitorController.getOneMonthOverview.bind(MonitorController)),
);

export { monitorRouter };
