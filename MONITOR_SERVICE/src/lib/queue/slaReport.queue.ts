import { Queue } from "bullmq";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { logger } from "../../utils/logger.utils";

export const SiteSLAQueue = new Queue("SiteSLAQueue", {
  connection: IoRedisClientForBullMQ,
});

export async function scheduleSLAReportJob() {
  try {
    await SiteSLAQueue.add(
      "generate-sla-report",
      {},
      {
        repeat: {
          every: 60 * 1000,
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId: "daily-sla-report-job",
      },
    );
    logger.info("Scheduled daily SLA report job to run at midnight");
  } catch (error) {
    logger.error("Failed to schedule SLA report job", { error });
  }
}
