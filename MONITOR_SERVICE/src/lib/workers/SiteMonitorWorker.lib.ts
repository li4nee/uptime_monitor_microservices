import { Job } from "bullmq";
import axios, { AxiosRequestConfig } from "axios";
import { NOTIFICATION_FREQUENCY, SiteMoniorDTO } from "../../typings/base.type";
import { SiteMonitoringHistory } from "../../entity/siteMonitoringHistory.entity";
import { SiteHistorySavingQueue } from "../queue/saveHistoryToDb.queue";
import { getMessageBrokerProducer } from "../Broker.lib";

export class SiteMonitorWorker {
  private messageBrokerProducer = getMessageBrokerProducer();

  constructor() {}

  async processJob(job: Job<SiteMoniorDTO>): Promise<void> {
    const data = job.data;

    const axiosConfig: AxiosRequestConfig = {
      url: data.url,
      method: data.httpMethod.toLowerCase() as any,
      headers: data.headers,
      data: data.body,
      timeout: data.maxResponseTime || 5000,
      validateStatus: () => true,
    };

    const start = performance.now();
    let duration = 0;
    let statusCode = 0;
    let isUp = false;
    let errorLog = "";

    try {
      const response = await axios(axiosConfig);
      duration = performance.now() - start;
      statusCode = response.status;
      isUp = duration <= (data.maxResponseTime || 5000) && statusCode >= 200 && statusCode < 400;
    } catch (error: any) {
      duration = performance.now() - start;
      errorLog = error?.message || "Unknown error";
      console.log(`Error processing job ${job.id}:`, error);
    }

    const history = new SiteMonitoringHistory();
    history.site = { id: data.siteId } as any;
    history.siteApi = { id: data.siteApiId } as any;
    history.status = isUp ? "UP" : "DOWN";
    history.statusCode = statusCode;
    history.responseTime = duration;
    history.checkedAt = new Date();
    history.httpMethod = data.httpMethod;
    history.headers = data.headers || {};
    history.body = data.body || {};
    history.errorLog = isUp ? "" : errorLog;
    history.attemptNumber = job.attemptsMade + 1;

    try {
      await SiteHistorySavingQueue.add("save-history", history);
    } catch (saveErr) {
      console.error(`Failed to queue history save for SiteApi ${data.siteApiId}:`, saveErr);
    }

    // Notification logic if the site is DOWN
    if (!isUp && data.notification) {
      const { notification } = data;
      if (
        this.shouldSendNotification(
          notification.lastSentNotificationAt,
          notification.notificationFrequency,
        )
      ) {
        await this.sendNotifications(data);
      }
    }
  }

  private shouldSendNotification(
    lastSent: Date | null | undefined,
    frequency: NOTIFICATION_FREQUENCY | undefined,
  ): boolean {
    if (!frequency || frequency === NOTIFICATION_FREQUENCY.NONE) return false;
    if (!lastSent) return true;
    const diffMs = new Date().getTime() - new Date(lastSent).getTime();

    switch (frequency) {
      case NOTIFICATION_FREQUENCY.ONCE:
        return false;
      case NOTIFICATION_FREQUENCY.EVERY:
        return true;
      case NOTIFICATION_FREQUENCY.HOURLY:
        return diffMs >= 60 * 60 * 1000;
      case NOTIFICATION_FREQUENCY.DAILY:
        return diffMs >= 24 * 60 * 60 * 1000;
      default:
        return false;
    }
  }

  private async sendNotifications(siteMonitor: SiteMoniorDTO): Promise<void> {
    const { notification } = siteMonitor;
    if (!notification) return;

    if (notification.emailEnabled && notification.emailAddress) {
      await this.sendEmail(siteMonitor);
    }
    if (notification.slackEnabled && notification.slackWebhook) {
      await this.sendSlackNotification(siteMonitor);
    }
    if (notification.discordEnabled && notification.discordWebhook) {
      await this.sendDiscordNotification(siteMonitor);
    }
  }

  private async sendEmail(siteMonitor: SiteMoniorDTO): Promise<void> {
    if (!siteMonitor.notification?.emailAddress) return;

    const subject = `🚨 [ALERT] ${siteMonitor.url} is DOWN`;
    const body = `
    <div style="font-family: Arial, sans-serif; padding: 10px;">
      <h2 style="color: red;">🚨 Website Down Alert!</h2>
      <p><strong>Website:</strong> <a href="${siteMonitor.url}">${siteMonitor.url}</a></p>
      <p><strong>Status:</strong> <span style="color: red;">Unreachable</span></p>
      <p>We detected a downtime on your monitored site. Please check it immediately.</p>
      <hr/>
      <small>This is an automated alert from the Uptime Monitoring System.</small>
    </div>
  `;
    try {
      await this.messageBrokerProducer.sendEmail(
        siteMonitor.notification.emailAddress,
        subject,
        body,
      );
    } catch (error) {
      console.error(`Failed to send email to ${siteMonitor.notification.emailAddress}:`, error);
    }
  }

  private async sendSlackNotification(siteMonitor: SiteMoniorDTO): Promise<void> {
    if (!siteMonitor.notification?.slackWebhook) return;

    const message = `
  :rotating_light: *Website Down Alert!*
  *URL:* <${siteMonitor.url}>
  *Status:* :x: Unreachable
  _Please investigate the issue as soon as possible._
  `;
    try {
      await this.messageBrokerProducer.sendSlackMessage(
        siteMonitor.notification.slackWebhook,
        message,
      );
    } catch (error) {
      console.error(
        `Failed to send Slack message to ${siteMonitor.notification.slackWebhook}:`,
        error,
      );
    }
  }

  private async sendDiscordNotification(siteMonitor: SiteMoniorDTO): Promise<void> {
    if (!siteMonitor.notification?.discordWebhook) return;

    const message = `
  ⚠️ **Website Down Alert!**  
  🌐 **URL:** ${siteMonitor.url}  
  ❌ **Status:** Unreachable  
  🔧 Please check your website as soon as possible.
  `;
    try {
      await this.messageBrokerProducer.sendDiscordMessage(
        siteMonitor.notification.discordWebhook,
        message,
      );
    } catch (e) {
      console.error(
        `Failed to send Discord message to ${siteMonitor.notification.discordWebhook}:`,
        e,
      );
    }
  }
}
