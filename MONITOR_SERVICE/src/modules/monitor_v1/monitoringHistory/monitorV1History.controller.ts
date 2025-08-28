import { AuthenticatedRequest } from "../../../typings/base.type";
import { Response } from "express";
import {
  GetApiPerformanceHistoryOverviewDto,
  getApiPerformanceHistoryOverviewDtoSchema,
  GetMonitoringHisoryDto,
  GetMonitoringHisoryDtoSchema,
  GetOneMonthOverviewDto,
  GetOneMonthOverviewDtoSchema,
  GetSLAReportHistoryDto,
  GetSLAReportHistoryDtoSchema,
} from "./monitorV1History.dto";
import { MonitorHistoryService } from "./monitorV1History.service";

class MonitorHistoryControllerClass {
  constructor(private readonly monitorHistoryService = MonitorHistoryService) {}

  async getMonitoringHistory(req: AuthenticatedRequest, res: Response) {
    let query: GetMonitoringHisoryDto = await GetMonitoringHisoryDtoSchema.validate(req.query);
    let result = await this.monitorHistoryService.getMonitoringHistory(query, req.userId);
    res.status(200).json(result);
  }

  async getOneMonthOverview(req: AuthenticatedRequest, res: Response) {
    let query: GetOneMonthOverviewDto = await GetOneMonthOverviewDtoSchema.validate(req.query);
    let result = await this.monitorHistoryService.getOneMonthOverview(query, req.userId);
    res.status(200).json(result);
  }

  async getSLAreportHistory(req: AuthenticatedRequest, res: Response) {
    let query: GetSLAReportHistoryDto = await GetSLAReportHistoryDtoSchema.validate(req.query);
    let result = await this.monitorHistoryService.getSLAreportHistory(query, req.userId);
    res.status(200).json(result);
  }

  async getApiPerformanceHistory(req: AuthenticatedRequest, res: Response) {
    let query: GetApiPerformanceHistoryOverviewDto = await getApiPerformanceHistoryOverviewDtoSchema.validate(req.query);
    let result = await this.monitorHistoryService.getApiPerformanceHistory(query, req.userId);
    res.status(200).json(result);
  }
}

export const MonitorHistoryController = new MonitorHistoryControllerClass();
