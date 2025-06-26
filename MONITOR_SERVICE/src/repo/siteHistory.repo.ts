import { AppDataSource } from "../dbconfig";
import { SiteMonitoringHistory } from "../entity/siteMonitoringHistory.entity";

export const SiteMonitoringHistoryModel = AppDataSource.getRepository(SiteMonitoringHistory)