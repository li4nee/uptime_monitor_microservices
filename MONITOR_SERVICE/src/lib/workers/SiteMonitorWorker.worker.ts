import { Job, Worker } from "bullmq";
import axios, { AxiosRequestConfig } from "axios";
import { NOTIFICATION_FREQUENCY, SiteMoniorDTO } from "../../typings/base.type";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { SiteHistorySavingQueue } from "../queue/saveHistoryToDb.queue";
import { getMessageBrokerProducer } from "../Broker.lib";
import { logger } from "../../utils/logger.utils";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { SiteApiModel } from "../../repo/siteApi.repo";

class SiteMonitorWorker {
  private messageBrokerProducer = getMessageBrokerProducer();
  private readonly siteApiModel = SiteApiModel
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      "SiteMonitorQueue",
      async (job: Job<SiteMoniorDTO>) => {
        await this.processJob(job);
      },
      {
        connection: IoRedisClientForBullMQ,
        concurrency: 5,
      },
    );

    this.worker.on("completed", (job) => this.handleJobCompleted(job));
    this.worker.on("failed", (job, err) => this.handleJobFailed(job, err));
  }

  private async handleJobCompleted(job: Job<SiteMoniorDTO>) {
    logger.info(`Job ${job.id} completed`);
    if (job.attemptsMade > 0) {
      logger.info(`Job ${job.id} completed after ${job.attemptsMade} attempts`);
    }
    const history = this.createHistoryFromJob(job, "UP", job.returnvalue?.statusCode || 200, job.returnvalue?.responseTime || 0);
    await this.saveHistory(history, job?.id);
  }

  private async handleJobFailed(job: Job<SiteMoniorDTO> | undefined, err: Error | undefined) {
    if (!job) return;
    logger.error(`Job ${job.id} failed with attempt ${job.attemptsMade + 1}`);
    if (job.attemptsMade + 1 < job.opts.attempts!) return;
    const history = this.createHistoryFromJob(
      job,
      "DOWN",
      job.returnvalue?.statusCode || 0,
      job.returnvalue?.responseTime || 0,
      err?.message || "Unknown error",
    );
    await this.saveHistory(history, job?.id, true);
  }

  private createHistoryFromJob(
    job: Job<SiteMoniorDTO>,
    status: "UP" | "DOWN",
    statusCode: number,
    responseTime: number,
    errorLog?: string,
  ): SiteMonitoringHistory {
    const { data } = job;
    const history = new SiteMonitoringHistory();

    history.site = { id: data.siteId } as any;
    history.siteApi = { id: data.siteApiId } as any;
    history.status = status;
    history.statusCode = statusCode;
    history.responseTime = responseTime;
    history.checkedAt = new Date();
    history.httpMethod = data.httpMethod;
    history.headers = data.headers || {};
    history.body = data.body || {};
    if (errorLog) history.errorLog = errorLog;
    history.attemptNumber = job.attemptsMade + 1;

    return history;
  }

  private async saveHistory(history: SiteMonitoringHistory, jobId: string | number | undefined, isFailure = false) {
    try {
      await SiteHistorySavingQueue.add("save-history", history);
      logger.info(`${isFailure ? "Final failure" : "History"} saved for job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to save ${isFailure ? "failure " : ""}history for job ${jobId}`, { error });
    }
  }

  private async processJob(job: Job<SiteMoniorDTO>): Promise<void> {
    const data = job.data;
    logger.info(`Processing job ${job.id} for site ${data.url}`);

    const axiosConfig: AxiosRequestConfig = {
      url: data.url,
      method: data.httpMethod.toLowerCase() as any,
      headers: data.headers,
      data: data.body,
      timeout: data.maxResponseTime || 5000,
      validateStatus: () => true,
    };

    const startTime = performance.now();

    try {
      const response = await axios(axiosConfig);
      const responseTime = performance.now() - startTime;
      const statusCode = response.status;
      const isUp = statusCode >= 200 && statusCode < 400 && responseTime <= (data.maxResponseTime || 5000);
      const isSlow = statusCode >= 200 && statusCode < 400 && !isUp;

      logger.info(`Site ${data.url} responded with ${statusCode} in ${responseTime.toFixed(2)}ms`);

      if (!isUp && data.notification) {
        const shouldSend = this.shouldSendNotification(data.notification.lastSentNotificationAt, data.notification.notificationFrequency);

        if (shouldSend) {
          logger.info(`Sending alert for ${data.url}`);
          await this.sendNotifications(data, isUp, isSlow);
          await this.siteApiModel.update({id:data.siteApiId},{
            notificationSetting:{
              lastNotificationSentAt: new Date(),
            }
          })
        } else {
          logger.info(`Skipping notification for ${data.url} due to frequency limit`);
        }
      }
    } catch (error: any) {
      logger.error(`Error processing site ${data.url}: ${error?.message || "Unknown error"}`);
      throw error; 
    }
  }

  private shouldSendNotification(lastSent: Date | null | undefined, frequency: NOTIFICATION_FREQUENCY | undefined): boolean {
    if (!frequency || frequency === NOTIFICATION_FREQUENCY.NONE) return false;
    if (!lastSent) return true;

    const elapsedMs = Date.now() - new Date(lastSent).getTime();

    switch (frequency) {
      case NOTIFICATION_FREQUENCY.ONCE:
        return false;
      case NOTIFICATION_FREQUENCY.EVERY:
        return true;
      case NOTIFICATION_FREQUENCY.HOURLY:
        return elapsedMs >= 3600000; // 1 hour
      case NOTIFICATION_FREQUENCY.DAILY:
        return elapsedMs >= 86400000; // 24 hours
      default:
        return false;
    }
  }

  private async sendNotifications(data: SiteMoniorDTO, isUp: boolean, isSlow: boolean): Promise<void> {
    const { notification } = data;
    if (!notification) return;

    try {
      if (notification.emailEnabled && notification.emailAddress) {
        await this.sendEmailNotification(data, isSlow);
      }
      if (notification.slackEnabled && notification.slackWebhook) {
        await this.sendSlackNotification(data, isSlow);
      }
      if (notification.discordEnabled && notification.discordWebhook) {
        await this.sendDiscordNotification(data, isSlow);
      }
    } catch (error) {
      logger.error(`📡 Notification failure for ${data.url}`, { error });
    }
  }

  private async sendEmailNotification(data: SiteMoniorDTO, isSlow: boolean) {
    const subject = isSlow ? `[WARNING] ${data.url} is SLOW` : `[ALERT] ${data.url} is DOWN`;
    const statusMsg = isSlow ? "Slow Response Time" : "Unreachable";

    const body = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: ${isSlow ? "orange" : "red"};">${statusMsg}</h2>
        <p><strong>Site:</strong> ${data.url}</p>
        <p>Status: <strong>${statusMsg}</strong></p>
        <p>${
          isSlow ? "Your site is responding slower than expected. Investigate performance." : "Your site is currently down. Please check immediately."
        }</p>
        <hr/>
        <small>This is an automated alert from SiteMonitor.</small>
      </div>`;

    await this.messageBrokerProducer.sendEmail(data.notification!.emailAddress!, subject, undefined, body);
  }

  private async sendSlackNotification(data: SiteMoniorDTO, isSlow: boolean) {
    const msg = isSlow
      ? `:warning: *Performance Alert!*\n*URL:* <${data.url}>\n*Status:* Slow response`
      : `:rotating_light: *Down Alert!*\n*URL:* <${data.url}>\n*Status:* Unreachable`;

    await this.messageBrokerProducer.sendSlackMessage(data.notification!.slackWebhook!, msg);
  }

  private async sendDiscordNotification(data: SiteMoniorDTO, isSlow: boolean) {
    const msg = isSlow
      ? ` **Performance Alert!**\n **URL:** ${data.url}\n **Status:** Slow`
      : `**Down Alert!**\n **URL:** ${data.url}\n **Status:** Unreachable`;

    await this.messageBrokerProducer.sendDiscordMessage(data.notification!.discordWebhook!, msg);
  }
}

export const siteMonitorWorker = new SiteMonitorWorker();
