import { AuthenticatedRequest } from "../../../typings/base.type";
import { Response } from "express";
import { GetMonitoringHisoryDto, GetMonitoringHisoryDtoSchema, GetOneMonthOverviewDto, GetOneMonthOverviewDtoSchema } from "./monitorV1History.dto";
import { MonitorHistoryService } from "./monitorV1History.service";

class MonitorHistoryControllerClass {
  constructor(private readonly monitorHistoryService = MonitorHistoryService) {}

  async getMonitoringHistory(req: AuthenticatedRequest, res: Response) {
    let body: GetMonitoringHisoryDto = await GetMonitoringHisoryDtoSchema.validate(req.query);
    let result = await this.monitorHistoryService.getMonitoringHistory(body, req.userId);
    res.status(200).json(result);
  }

  async getOneMonthOverview(req: AuthenticatedRequest, res: Response) {
    let body: GetOneMonthOverviewDto = await GetOneMonthOverviewDtoSchema.validate(req.query);
    let result = await this.monitorHistoryService.getOneMonthOverview(body, req.userId);
    res.status(200).json(result);
  }
}

export const MonitorHistoryController = new MonitorHistoryControllerClass();
