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
    let isSlow = false;
    try {
      const response = await axios(axiosConfig);
      duration = performance.now() - start;
      statusCode = response.status;
      if (statusCode >= 200 && statusCode < 400) {
        if (duration <= (data.maxResponseTime || 5000)) {
          isUp = true;
        } else {
          isSlow = true;
        }
      }
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
    if (!isUp && data.notification) {
      const { notification } = data;
      if (this.shouldSendNotification(notification.lastSentNotificationAt, notification.notificationFrequency)) {
        await this.sendNotifications(data, isUp, isSlow);
      }
    }
    try {
      await SiteHistorySavingQueue.add("save-history", history);
    } catch (saveErr) {
      console.error(`Failed to queue history save for SiteApi ${data.siteApiId}:`, saveErr);
    }
  }

  private shouldSendNotification(lastSent: Date | null | undefined, frequency: NOTIFICATION_FREQUENCY | undefined): boolean {
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

  private async sendNotifications(siteMonitor: SiteMoniorDTO, isUp: boolean, isSlow: boolean): Promise<void> {
    const { notification } = siteMonitor;
    if (!notification) return;

    if (notification.emailEnabled && notification.emailAddress) {
      await this.sendEmail(siteMonitor, isUp, isSlow);
    }
    if (notification.slackEnabled && notification.slackWebhook) {
      await this.sendSlackNotification(siteMonitor, isUp, isSlow);
    }
    if (notification.discordEnabled && notification.discordWebhook) {
      await this.sendDiscordNotification(siteMonitor, isUp, isSlow);
    }
  }

  private async sendEmail(siteMonitor: SiteMoniorDTO, isUp: boolean, isSlow: boolean): Promise<void> {
    const subject = isSlow ? `⚠️ [WARNING] ${siteMonitor.url} is SLOW` : `🚨 [ALERT] ${siteMonitor.url} is DOWN`;

    const statusMessage = isSlow ? "Slow Response Time" : "Unreachable";

    const body = `
    <div style="font-family: Arial, sans-serif; padding: 10px;">
      <h2 style="color: ${isSlow ? "orange" : "red"};">${isSlow ? "⚠️ Performance Issue" : "🚨 Website Down Alert!"}</h2>
      <p><strong>Website:</strong> <a href="${siteMonitor.url}">${siteMonitor.url}</a></p>
      <p><strong>Status:</strong> <span style="color: ${isSlow ? "orange" : "red"};">${statusMessage}</span></p>
      <p>${
        isSlow
          ? "Your site responded, but slower than expected. Investigate possible bottlenecks."
          : "We detected a downtime on your monitored site. Please check it immediately."
      }</p>
      <hr/>
      <small>This is an automated alert from the Uptime Monitoring System.</small>
    </div>
  `;
    try {
      await this.messageBrokerProducer.sendEmail(siteMonitor.notification!.emailAddress!, subject, body);
    } catch (error) {
      console.error(`Failed to send email to ${siteMonitor.notification!.emailAddress}:`, error);
    }
  }

  private async sendSlackNotification(siteMonitor: SiteMoniorDTO, isUp: boolean, isSlow: boolean): Promise<void> {
    const message = isSlow
      ? `:warning: *Website Performance Alert!*\n*URL:* <${siteMonitor.url}>\n*Status:* :snail: Slow Response\n_Please review server performance or third-party APIs._`
      : `:rotating_light: *Website Down Alert!*\n*URL:* <${siteMonitor.url}>\n*Status:* :x: Unreachable\n_Please investigate the issue as soon as possible._`;

    try {
      await this.messageBrokerProducer.sendSlackMessage(siteMonitor.notification!.slackWebhook!, message);
    } catch (error) {
      console.error(`Failed to send Slack message to ${siteMonitor.notification!.slackWebhook}:`, error);
    }
  }

  private async sendDiscordNotification(siteMonitor: SiteMoniorDTO, isUp: boolean, isSlow: boolean): Promise<void> {
    const message = isSlow
      ? `⚠️ **Website Performance Alert!**  
      🌐 **URL:** ${siteMonitor.url}  
      🐢 **Status:** Slow Response  
      🔍 Please investigate performance issues.`
      : `🚨 **Website Down Alert!**  
      🌐 **URL:** ${siteMonitor.url}  
      ❌ **Status:** Unreachable  
      🔧 Please check your website as soon as possible.`;

    try {
      await this.messageBrokerProducer.sendDiscordMessage(siteMonitor.notification!.discordWebhook!, message);
    } catch (e) {
      console.error(`Failed to send Discord message to ${siteMonitor.notification!.discordWebhook}:`, e);
    }
  }
}
