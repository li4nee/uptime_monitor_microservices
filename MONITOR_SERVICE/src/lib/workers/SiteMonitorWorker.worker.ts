import { Job, Worker } from "bullmq";
import axios, { AxiosRequestConfig } from "axios";
import { NOTIFICATION_FREQUENCY, SiteMonitorDTO } from "../../typings/base.type";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { SiteHistorySavingQueue } from "../queue/saveHistoryToDb.queue";
import { getMessageBrokerProducer } from "../Broker.lib";
import { logger } from "../../utils/logger.utils";
import { IoRedisClientForBullMQ } from "../../dbconfig";
import { SiteApiModel } from "../../repo/siteApi.repo";
import { normalizeUrl } from "../../utils/base.utils";
import { performance } from "perf_hooks";

enum STATUS {
  UP = "UP",
  DOWN = "DOWN",
}

class SiteMonitorWorker {
  private messageBrokerProducer = getMessageBrokerProducer();
  private readonly siteApiModel = SiteApiModel;
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      "SiteMonitorQueue",
      async (job: Job<SiteMonitorDTO>) => {
        return await this.processJob(job);
      },
      {
        connection: IoRedisClientForBullMQ,
        concurrency: 5,
      },
    );

    this.worker.on("completed", (job) => this.handleJobCompleted(job));
    this.worker.on("failed", (job, err) => this.handleJobFailed(job, err));

    process.on("SIGINT", async () => {
      await this.worker.close(true);
      process.exit(0);
    });
  }

  private async handleJobCompleted(job: Job<SiteMonitorDTO>) {
    logger.info(`Job ${job.id} completed after ${job.attemptsMade} attempts`);
    const history = this.createHistoryFromJob(job, STATUS.UP, job.returnvalue?.statusCode || 200, job.returnvalue?.responseTime || 0);
    await this.saveHistory(history, job?.id);
  }

  private async handleJobFailed(job: Job<SiteMonitorDTO> | undefined, err: Error | undefined) {
    if (!job) return;
    logger.error(`Job ${job.id} failed with attempt ${job.attemptsMade + 1}`);

    const maxAttempts = job.data?.maxNumberOfAttempts ?? job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;

    const history = this.createHistoryFromJob(
      job,
      STATUS.DOWN,
      job.returnvalue?.statusCode || 0,
      job.returnvalue?.responseTime || 0,
      job.returnvalue?.errorLog || err?.message || "Unknown error",
    );
    await this.saveHistory(history, job.id, true);
  }

  private createHistoryFromJob(
    job: Job<SiteMonitorDTO>,
    status: STATUS,
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
    history.errorLog = errorLog || "";
    history.attemptNumber = job.attemptsMade;
    history.completeUrl = data.completeUrl;
    history.notificationSentTo = {
      email: job.returnvalue?.notificationReport?.emailSentTo,
      slack: job.returnvalue?.notificationReport?.slackSentTo,
      discord: job.returnvalue?.notificationReport?.discordSentTo,
    };
    history.wasNotificationSent = job.returnvalue?.notificationReport?.shouldSend;
    return history;
  }

  private async saveHistory(history: SiteMonitoringHistory, jobId: string | number | undefined, isFailure = false) {
    try {
      await SiteHistorySavingQueue.add("save-history", history);
      logger.info(`${isFailure ? "Final failure" : "History"} saved for siteApi ${history.siteApi.id} with job ID ${jobId}`);
    } catch (error) {
      logger.error(`Failed to save ${isFailure ? "failure " : ""}history for siteAPI ${history.siteApi.id} with job ID ${jobId}`, { error });
    }
  }

  private async processJob(job: Job<SiteMonitorDTO>): Promise<{
    statusCode: number;
    responseTime: number;
    isUp: boolean;
    isSlow: boolean;
    errorLog?: string;
    notificationReport?: { shouldSend: boolean; emailSentTo?: string; slackSentTo?: string; discordSentTo?: string };
  }> {
    const data = job.data;
    logger.info(`Processing job ${job.id} for site ${data.completeUrl}`);

    const axiosConfig: AxiosRequestConfig = {
      url: normalizeUrl(data.completeUrl),
      method: data.httpMethod.toLowerCase() as any,
      headers: data.headers,
      data: data.body,
      timeout: data.maxResponseTime || 5000,
      validateStatus: () => true,
    };

    const startTime = performance.now();
    let responseTime = 0;
    let notificationReport: { shouldSend: boolean; emailSentTo?: string; slackSentTo?: string; discordSentTo?: string } | undefined;
    try {
      const response = await axios(axiosConfig);
      responseTime = performance.now() - startTime;

      const statusCode = response.status;
      const isHealthy = statusCode >= 200 && statusCode < 400 && responseTime <= (data.maxResponseTime || 5000);
      const isUp = statusCode >= 200 && statusCode < 400;
      const isSlow = isUp && !isHealthy;

      logger.info(`Site ${data.completeUrl} responded with ${statusCode} in ${responseTime.toFixed(2)}ms`);

      if ((!isHealthy || isSlow) && data.notification) {
        const shouldSend = this.shouldSendNotification(data.notification.lastSentNotificationAt, data.notification.notificationFrequency);

        if (shouldSend) {
          logger.info(`Sending alert for ${data.completeUrl}`);
          notificationReport = await this.sendNotifications(data, isHealthy, isSlow);
          const siteApi = await this.siteApiModel
            .createQueryBuilder("siteApi")
            .leftJoinAndSelect("siteApi.notificationSetting", "notificationSetting")
            .where("siteApi.id = :id", { id: data.siteApiId })
            .select(["siteApi.id", "notificationSetting.id", "notificationSetting.lastNotificationSentAt"])
            .getOne();

          if (siteApi?.notificationSetting) {
            siteApi.notificationSetting.lastNotificationSentAt = new Date();
            await this.siteApiModel.save(siteApi);
          } else {
            logger.warn(`notificationSetting not found for SiteApi ${data.siteApiId}`);
          }
        } else {
          logger.info(`Skipping notification for ${data.completeUrl} due to frequency limit`);
        }
      }

      return { statusCode, responseTime, isUp: isHealthy, isSlow, errorLog: statusCode >= 400 ? response.statusText : undefined, notificationReport };
    } catch (error: any) {
      responseTime = performance.now() - startTime;
      const errorMsg = error.code === "ECONNABORTED" ? "Request timed out" : error?.message || "Unknown error";

      logger.error(`Error processing site ${data.completeUrl}: ${errorMsg}`, { error });

      return {
        statusCode: 0,
        responseTime,
        isUp: false,
        isSlow: false,
        errorLog: errorMsg,
        notificationReport: data.notification ? await this.sendNotifications(data, false, false) : undefined,
      };
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
        return elapsedMs >= 3600000;
      case NOTIFICATION_FREQUENCY.DAILY:
        return elapsedMs >= 86400000;
      default:
        return false;
    }
  }

  private async sendNotifications(
    data: SiteMonitorDTO,
    isUp: boolean,
    isSlow: boolean,
  ): Promise<{ shouldSend: boolean; emailSentTo?: string; slackSentTo?: string; discordSentTo?: string } | undefined> {
    const { notification } = data;
    if (!notification) return;
    let notificationReport: { shouldSend: boolean; emailSentTo?: string; slackSentTo?: string; discordSentTo?: string } = { shouldSend: false };
    try {
      if (notification.emailEnabled && notification.emailAddress) {
        await this.sendEmailNotification(data, isSlow);
        notificationReport.shouldSend = true;
        notificationReport.emailSentTo = notification.emailAddress;
      }
      if (notification.slackEnabled && notification.slackWebhook) {
        await this.sendSlackNotification(data, isSlow);
        notificationReport.shouldSend = true;
        notificationReport.slackSentTo = notification.slackWebhook;
      }
      if (notification.discordEnabled && notification.discordWebhook) {
        await this.sendDiscordNotification(data, isSlow);
        notificationReport.shouldSend = true;
        notificationReport.discordSentTo = notification.discordWebhook;
      }
      return notificationReport;
    } catch (error) {
      logger.error(`Notification failure for ${data.completeUrl}`, { error });
      return { shouldSend: false };
    }
  }

  private async sendEmailNotification(data: SiteMonitorDTO, isSlow: boolean) {
    const subject = isSlow ? `[WARNING] ${data.completeUrl} is SLOW` : `[ALERT] ${data.completeUrl} is DOWN`;
    const statusMsg = isSlow ? "Slow Response Time" : "Unreachable";

    const body = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: ${isSlow ? "orange" : "red"};">${statusMsg}</h2>
        <p><strong>Site:</strong> ${data.completeUrl}</p>
        <p>Status: <strong>${statusMsg}</strong></p>
        <p>${isSlow ? "Your site is responding slower than expected. Investigate performance." : "Your site is currently down. Please check immediately."}</p>
        <hr/>
        <small>This is an automated alert from SiteMonitor.</small>
      </div>`;

    await this.messageBrokerProducer.sendEmail(data.notification!.emailAddress!, subject, undefined, body);
  }

  private async sendSlackNotification(data: SiteMonitorDTO, isSlow: boolean) {
    const msg = isSlow
      ? `:warning: *Performance Alert!*\n*URL:* <${data.completeUrl}>\n*Status:* Slow response`
      : `:rotating_light: *Down Alert!*\n*URL:* <${data.completeUrl}>\n*Status:* Unreachable`;

    await this.messageBrokerProducer.sendSlackMessage(data.notification!.slackWebhook!, msg);
  }

  private async sendDiscordNotification(data: SiteMonitorDTO, isSlow: boolean) {
    const msg = isSlow
      ? `**Performance Alert!**\n**URL:** ${data.completeUrl}\n**Status:** Slow`
      : `**Down Alert!**\n**URL:** ${data.completeUrl}\n**Status:** Unreachable`;

    await this.messageBrokerProducer.sendDiscordMessage(data.notification!.discordWebhook!, msg);
  }
}

export const siteMonitorWorker = new SiteMonitorWorker();
