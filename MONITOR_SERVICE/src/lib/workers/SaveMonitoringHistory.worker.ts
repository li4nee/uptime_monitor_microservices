import { Worker, Job } from "bullmq";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { SiteMonitoringHistoryModel } from "../../repo/siteHistory.repo";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { logger } from "../../utils/logger.utils";

export class SiteHistoryBatchWorker {
  private buffer: SiteMonitoringHistory[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly MAX_BATCH = 50;
  private readonly TIME_TO_SAVE = 5000;
  private worker: Worker;

  constructor() {
    this.worker = new Worker("save-site-history", this.handleJob.bind(this), {
      connection: IoRedisClientForBullMQ,
    });

    this.worker.on("failed", (job, err) => {
      logger.error(`Job ${job?.id} failed`, { error: err });
    });

    logger.info("SiteHistoryBatchWorker initialized");

    this.flushTimer = setInterval(() => this.flush(), this.TIME_TO_SAVE);

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down...");
      await this.shutdown();
    });
  }

  private async handleJob(job: Job<SiteMonitoringHistory>) {
    this.buffer.push(job.data);

    if (this.buffer.length >= this.MAX_BATCH) {
      clearInterval(this.flushTimer!);
      await this.flush();
      this.flushTimer = setInterval(() => this.flush(), this.TIME_TO_SAVE);
    }
  }

  private async flush(): Promise<void> {
    if (!this.buffer.length) return;

    const toInsert = this.buffer.splice(0, this.buffer.length);

    try {
      await SiteMonitoringHistoryModel.save(toInsert);
      logger.info(`Saved ${toInsert.length} site monitoring records`);
    } catch (err) {
      logger.error("Error saving site monitoring history", { error: err });
    }
  }

  async shutdown() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    logger.info("Flushing remaining records before shutdown...");
    await this.flush();
    await this.worker.close();
    logger.info("SiteHistoryBatchWorker shut down cleanly");
    process.exit(0);
  }
}

export const siteHistoryBatchWorker = new SiteHistoryBatchWorker();
