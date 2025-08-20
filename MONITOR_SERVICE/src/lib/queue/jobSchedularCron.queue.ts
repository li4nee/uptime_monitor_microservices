import { Queue } from "bullmq";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { logger } from "../../utils/logger.utils";

export const MonitorSchedulerQueue = new Queue("MonitorSchedulerQueue", {
  connection: IoRedisClientForBullMQ,
});

export async function scheduleMonitorJob() {
  try {
    await MonitorSchedulerQueue.add(
      "monitor-sites-cronjob",
      {},
      {
        repeat: {
          every: 1 * 60 * 1000,
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId: "singleton-monitor-job",
      },
    );
    logger.info("Scheduled monitor job to run every 1 minutes");
  } catch (error) {
    logger.error("Failed to schedule monitor job", { error });
  }
}
