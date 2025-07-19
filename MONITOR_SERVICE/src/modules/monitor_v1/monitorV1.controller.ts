import { AuthenticatedRequest } from "../../typings/base.type";
import {
  AddMonitoringRoutesDto,
  AddMonitoringRoutesDtoSchema,
  GetMonitoringHisoryDto,
  GetMonitoringHisoryDtoSchema,
  GetMonitoringRoutesDto,
  GetMonitoringRoutesDtoSchema,
  GetOneMonthOverviewDto,
  GetOneMonthOverviewDtoSchema,
} from "./monitorV1.dto";

import { Response } from "express";
import { MonitorService } from "./monitorV1.service";
class MonitorControllerClass {
  constructor(private readonly monitorService = MonitorService) {}

  async registerSiteMonitor(req: AuthenticatedRequest, res: Response) {
    let body: AddMonitoringRoutesDto = await AddMonitoringRoutesDtoSchema.validate(req.body);
    console.log(req.userId);
    let result = await this.monitorService.resisterRoutesApiToMonitor(body, req.userId);
    res.status(200).json(result);
    return;
  }

  async getRoutes(req: AuthenticatedRequest, res: Response) {
    let body: GetMonitoringRoutesDto = await GetMonitoringRoutesDtoSchema.validate(req.query);
    let result = await this.monitorService.getMonitoringRoutes(body, req.userId);
    res.status(200).json(result);
    return;
  }

  async getMonitoringHistory(req: AuthenticatedRequest, res: Response) {
    let body: GetMonitoringHisoryDto = await GetMonitoringHisoryDtoSchema.validate(req.query);
    let result = await this.monitorService.getMonitoringHistory(body, req.userId);
    res.status(200).json(result);
  }

  async getOneMonthOverview(req: AuthenticatedRequest, res: Response) {
    let body: GetOneMonthOverviewDto = await GetOneMonthOverviewDtoSchema.validate(req.query);
    let result = await this.monitorService.getOneMonthOverview(body, req.userId);
    res.status(200).json(result);
  }
}

export const MonitorController = new MonitorControllerClass();
