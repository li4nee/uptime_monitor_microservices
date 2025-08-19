import { Worker } from "bullmq";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { logger } from "../../utils/logger.utils";
import { SiteSLAReportModel } from "../../repo/siteDailySLAReport.repo";
import { SiteMonitoringHistoryModel } from "../../repo/siteHistory.repo";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { Between } from "typeorm";
import { SLAReportMonitorinHistoryDto } from "../../typings/base.type";
import { SiteSLAReport } from "../../entity/siteDailySLAReport.entity";

class SiteSLAWorker {
  private worker: Worker;
  private siteSlaReportModel = SiteSLAReportModel;
  private siteMonitoringHistoryModel = SiteMonitoringHistoryModel;

  constructor() {
    this.worker = new Worker(
      "SiteSLAQueue",
      async () => {
        return await this.processJob();
      },
      {
        connection: IoRedisClientForBullMQ,
        concurrency: 2,
      },
    );

    this.worker.on("completed", (job) => this.handleJobCompleted(job));
    this.worker.on("failed", (job, err) => this.handleJobFailed(job, err));

    process.on("SIGINT", async () => {
      await this.worker.close(true);
      process.exit(0);
    });
  }

  private async processJob() {
    let now = new Date();
    let yesterDayStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    let yesterDayEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);

    let monitoringHisory = await this.getMonitoringHistory(yesterDayStartTime, yesterDayEndTime);
    if (!monitoringHisory || monitoringHisory.length === 0) {
      logger.info("No monitoring history found for the previous day.");
      return;
    }
    try {
      const slaReports = monitoringHisory.map((history) => {
        return this.createSlaReport(history, yesterDayStartTime, yesterDayEndTime);
      });
      if (slaReports.length > 0) {
        await this.siteSlaReportModel.save(slaReports);
      }
    } catch (error) {
      logger.error("Error processing SLA report job for " + yesterDayStartTime, { error });
      return;
    }
  }

  private async getMonitoringHistory(startTime: Date, endTime: Date): Promise<SLAReportMonitorinHistoryDto[]> {
    try {
      const aggregated = await this.siteMonitoringHistoryModel
        .createQueryBuilder("history")
        .select([
          "history.siteId AS siteId",
          "COUNT(*) AS total",
          "SUM(CASE WHEN history.status = 'UP' THEN 1 ELSE 0 END) AS up",
          "SUM(CASE WHEN history.status = 'DOWN' THEN 1 ELSE 0 END) AS down",
          "AVG(history.responseTime) AS avgResponseTime",
          "MAX(history.responseTime) AS maxResponseTime",
          "MIN(history.responseTime) AS minResponseTime",
          "SUM(CASE WHEN history.responseTime > 1000 THEN 1 ELSE 0 END) AS slowResponseCount",
        ])
        .where("history.checkedAt BETWEEN :start AND :end", { start: startTime, end: endTime })
        .groupBy("history.siteId")
        .getRawMany();

      return aggregated;
    } catch (error) {
      logger.error("Error fetching monitoring history", { error });
      return [];
    }
  }

  private createSlaReport(history: SLAReportMonitorinHistoryDto, startTime: Date, endTime: Date): SiteSLAReport {
    const slaReport = new SiteSLAReport();
    slaReport.site = { id: history.siteId } as any;
    slaReport.periodStart = startTime;
    slaReport.periodEnd = endTime;
    slaReport.totalChecks = history.total;
    slaReport.upChecks = history.up;
    slaReport.downChecks = history.down;
    slaReport.averageResponseTime = history.avgResponseTime;
    slaReport.uptimePercentage = (history.up / history.total) * 100 || 0;
    slaReport.maxResponseTime = history.maxResponseTime;
    slaReport.minResponseTime = history.minResponseTime;
    slaReport.slowResponseCount = history.slowResponseCount;
    return slaReport;
  }

  private handleJobCompleted(job: any) {
    logger.info(`SLA daily report job completed: ${job.id}`);
  }

  private handleJobFailed(job: any, error: Error) {
    logger.error(`SLA daily report job failed: ${job.id}`, { error });
  }
}

export default new SiteSLAWorker();
