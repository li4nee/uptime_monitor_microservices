import { AddMonitoringRoutesDto, GetMonitoringHisoryDto, GetMonitoringRoutesDto, GetOneMonthOverviewDto } from "./monitor.dto";

class MonitorServiceClass{
    constructor() {
 
    }

    async resisterRoutesApiToMonitor(body:AddMonitoringRoutesDto){

    }

    async getMonitoringRoutes(query:GetMonitoringRoutesDto)
    {

    }

    async getMonitoringHistory(query:GetMonitoringHisoryDto)
    {

    }

    async getOneMonthOverview(query:GetOneMonthOverviewDto)
    {

    }

    
}

export const MonitorService = new MonitorServiceClass();