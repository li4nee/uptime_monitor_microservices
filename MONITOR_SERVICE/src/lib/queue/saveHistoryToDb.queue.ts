import { Queue } from "bullmq";
import { IoRedisClientForBullMQ } from "../../dbconfig";

export const SiteHistorySavingQueue = new Queue("save-site-history", {
  connection: IoRedisClientForBullMQ,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    delay: 2000,
    attempts: 2,
  },
});
