import { AddMonitoringRoutesDto, GetMonitoringHisoryDto, GetMonitoringRoutesDto } from "./monitor.dto";

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

    
}

export const MonitorService = new MonitorServiceClass();