import { Queue } from "bullmq";
import { IoRedisClientForBullMQ } from "../../dbconfig";

export const SiteMonitorQueue = new Queue("SiteMonitorQueue", {
  connection: IoRedisClientForBullMQ,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 5,
    backoff: {
      type: "fixed",
      delay: 2000,
    },
    priority: 1,
  },
});
