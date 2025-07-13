import { Worker, Job } from "bullmq";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { SiteMonitoringHistoryModel } from "../../repo/siteHistory.repo";
import { IoRedisClientForBullMQ } from "../../dbconfig";

export class SiteHistoryBatchWorker {
  private buffer: SiteMonitoringHistory[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly MAX_BATCH = 50;
  private readonly TIME_TO_SAVE = 5000;

  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      "save-site-history",
      this.handleJob.bind(this),
      {
        connection: IoRedisClientForBullMQ,
      }
    );

    this.flushTimer = setInterval(() => this.flush(), this.TIME_TO_SAVE);

    process.on("SIGINT", async () => {
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
    } catch (err) {
    }
  }

  async shutdown() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
    await this.worker.close();
    process.exit(0);
  }
}
