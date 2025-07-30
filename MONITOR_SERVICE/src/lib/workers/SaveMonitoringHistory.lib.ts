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

    logger.info("Initialized SiteHistoryBatchWorker", {
      service: "MONITOR_WORKER",
      caller: "SiteHistoryBatchWorker.constructor",
    });

    this.flushTimer = setInterval(() => this.flush(), this.TIME_TO_SAVE);

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down worker", {
        service: "MONITOR_WORKER",
        caller: "SiteHistoryBatchWorker.constructor",
      });
      await this.shutdown();
    });
  }

  private async handleJob(job: Job<SiteMonitoringHistory>) {
    logger.info(`Received job ${job.id}`, {
      service: "MONITOR_WORKER",
      caller: "SiteHistoryBatchWorker.handleJob",
      jobId: job.id,
    });

    this.buffer.push(job.data);

    if (this.buffer.length >= this.MAX_BATCH) {
      logger.info("Buffer reached MAX_BATCH, flushing...", {
        service: "MONITOR_WORKER",
        caller: "SiteHistoryBatchWorker.handleJob",
        bufferLength: this.buffer.length,
      });
      clearInterval(this.flushTimer!);
      await this.flush();
      this.flushTimer = setInterval(() => this.flush(), this.TIME_TO_SAVE);
    }
  }

  private async flush(): Promise<void> {
    if (!this.buffer.length) return;

    const toInsert = this.buffer.splice(0, this.buffer.length);

    logger.info(`Flushing ${toInsert.length} site history records to DB`, {
      service: "MONITOR_WORKER",
      caller: "SiteHistoryBatchWorker.flush",
    });

    try {
      await SiteMonitoringHistoryModel.save(toInsert);
      logger.info(`Successfully saved ${toInsert.length} records`, {
        service: "MONITOR_WORKER",
        caller: "SiteHistoryBatchWorker.flush",
      });
    } catch (err) {
      logger.error("Error saving site monitoring history", {
        service: "MONITOR_WORKER",
        caller: "SiteHistoryBatchWorker.flush",
        error: err,
      });
    }
  }

  async shutdown() {
    if (this.flushTimer) clearInterval(this.flushTimer);

    logger.info("Shutting down: Flushing remaining records", {
      service: "MONITOR_WORKER",
      caller: "SiteHistoryBatchWorker.shutdown",
    });

    await this.flush();

    await this.worker.close();

    logger.info("Worker closed successfully", {
      service: "MONITOR_WORKER",
      caller: "SiteHistoryBatchWorker.shutdown",
    });

    process.exit(0);
  }
}
