import { Job } from "bullmq";
import { SiteMoniorDTO } from "../../typings/base.type";
import axios, { AxiosRequestConfig } from "axios";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { SiteHistorySavingQueue } from "../queue/saveHistoryToDb.queue";
export class SiteMonitorWorker {
  async processJob(jobData: Job<SiteMoniorDTO>): Promise<void> {
    let axiosConfig: AxiosRequestConfig = {
      url: jobData.data.url,
      method: jobData.data.httpMethod.toLowerCase(),
      headers: jobData.data.headers,
      data: jobData.data.body,
      timeout: jobData.data.maxResponseTime || 5000,
      validateStatus: () => true, // Doesn't throw error for non-2xx status codes
    };
    let start = performance.now();
    let response;
    let isUp = false;
    let statusCode = 0;
    let duration = 0;
    let maxResponseTime = jobData.data.maxResponseTime || 5000;
    try {
      response = await axios(axiosConfig);
      duration = performance.now() - start;
      statusCode = response.status;
      isUp = duration <= maxResponseTime && statusCode >= 200 && statusCode < 400;
    } catch (error) {
      console.error(`Error processing job ${jobData.id}:`, error);
      duration = performance.now() - start;
      throw error; // Re-throw to let BullMQ handle retries
    }
    // QUEUE TO SAVE IN THE DATABASE AND THROTTLE THE SAVING
    let siteMonitoringHistory = new SiteMonitoringHistory();
    siteMonitoringHistory.site = { id: jobData.data.siteId } as any;
    siteMonitoringHistory.siteApi = { id: jobData.data.siteApiId } as any;
    siteMonitoringHistory.status = isUp ? "UP" : "DOWN";
    siteMonitoringHistory.statusCode = statusCode;
    siteMonitoringHistory.responseTime = duration;
    siteMonitoringHistory.checkedAt = new Date();
    siteMonitoringHistory.httpMethod = jobData.data.httpMethod;
    siteMonitoringHistory.headers = jobData.data.headers || {};
    siteMonitoringHistory.body = jobData.data.body || {};
    siteMonitoringHistory.errorLog = isUp
      ? ""
      : `Error: ${response?.statusText || "Unknown error"}`;
    siteMonitoringHistory.attemptNumber = jobData.attemptsMade + 1;
    await SiteHistorySavingQueue.add("save-history", siteMonitoringHistory).catch((error) => {
      console.error(
        `Failed to add history saving job for siteApi ${jobData.data.siteApiId}:`,
        error,
      );
    });
    // If the site is down, we can implement additional logic here, like sending notifications
  }
}
