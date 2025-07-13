import { AuthenticatedRequest } from "../../typings/base.type";
import { AddMonitoringRoutesDto, AddMonitoringRoutesDtoSchema, GetMonitoringHisoryDto, GetMonitoringHisoryDtoSchema, GetMonitoringRoutesDto, GetMonitoringRoutesDtoSchema } from "./monitor.dto";
import { MonitorService } from "./monitor.service";
import { Response } from "express";
class MonitorControllerClass{
    constructor(
        private readonly monitorService = MonitorService
    ){}

    async registerSiteMonitor(req:AuthenticatedRequest,res:Response)
    {
        let body:AddMonitoringRoutesDto = await AddMonitoringRoutesDtoSchema.validate(req.body)
        let result = await this.monitorService.resisterRoutesApiToMonitor(body)
        res.status(200).json(result)
        return 
    }

    async getRoutes(req:AuthenticatedRequest,res:Response)
    {   
        let body:GetMonitoringRoutesDto = await GetMonitoringRoutesDtoSchema.validate(req.query)
        let result = await this.monitorService.getMonitoringRoutes(body)
        res.status(200).json(result)
        return 
    }

    async getMonitoringHistory(req:AuthenticatedRequest,res:Response)
    {
        let body : GetMonitoringHisoryDto = await GetMonitoringHisoryDtoSchema.validate(req.query)
        let result = await this.monitorService.getMonitoringHistory(body)
        res.status(200).json(result)
    }

    async getOneMonthOverview(req:AuthenticatedRequest,res:Response)
    {

    }

}

export const MonitorController = new MonitorControllerClass();