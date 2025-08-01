import { Worker, Job } from "bullmq";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { logger } from "../../utils/logger.utils";
import { SiteMonitorService } from "../Sitemonitor.lib";

const siteMonitorService = new SiteMonitorService();

const monitorWorker = new Worker(
  "MonitorSchedulerQueue",
  async (job: Job) => {
    try {
      logger.info("Executing CronJob", { jobId: job.id });
      await siteMonitorService.monitorTheSites();
    } catch (error) {
      logger.error("Error during site monitoring job.", { jobId: job.id, error });
      throw error;
    }
  },
  {
    connection: IoRedisClientForBullMQ,
  },
);

monitorWorker.on("failed", (job, err) => {
  logger.error("Scheduled monitor job failed.", { jobId: job?.id, err });
});
