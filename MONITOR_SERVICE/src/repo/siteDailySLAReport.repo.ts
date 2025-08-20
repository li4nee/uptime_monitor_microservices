import { AppDataSource } from "../dbconfig";
import { SiteSLAReport } from "../entity/siteDailySLAReport.entity";

export const SiteSLAReportModel = AppDataSource.getRepository(SiteSLAReport);
