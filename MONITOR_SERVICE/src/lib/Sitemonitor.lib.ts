import { Site } from "../entity/site.entity";
import { SiteApi } from "../entity/siteApi.entity";
import { SiteModel } from "../repo/site.repo";
import { SiteMoniorDTO } from "../typings/base.type";
import { SiteMonitorQueue } from "./queue/sitemonitor.queue";
import { logger } from "../utils/logger.utils";
import { normalizeUrl } from "../utils/base.utils";

export class SiteMonitorService {
  private readonly BatchSize = 100;

  constructor(
    private readonly siteModel = SiteModel,
    private readonly siteMonitorQueue = SiteMonitorQueue,
  ) {}

  async monitorTheSites(): Promise<void> {
    let page = 0;
    try {
      logger.info("Site monitoring started");

      while (true) {
        const sites = await this.siteModel.find({
          where: { trash: false, siteApis: { isActive: true } },
          relations: { siteApis: { notificationSetting: true } },
          take: this.BatchSize,
          skip: page * this.BatchSize,
          order: { createdAt: "ASC" },
          select: {
            id: true,
            url: true,
            userId: true,
            notification: true,
            createdAt: true,
            siteApis: {
              id: true,
              body: true,
              headers: true,
              httpMethod: true,
              maxResponseTime: true,
              maxNumberOfAttempts: true,
              notificationSetting: {
                emailEnabled: true,
                emailAddress: true,
                discordEnabled: true,
                discordWebhook: true,
                slackEnabled: true,
                slackWebhook: true,
                notificationFrequency: true,
                lastNotificationSentAt: true,
              },
              priority: true,
            },
          },
        });

        if (!sites?.length) break;

        const allJobPromises = sites.flatMap((site) => {
          if (!site.siteApis?.length) return [];
          return site.siteApis.map((api) =>
            this.queueSiteApiJob(site, api).catch((err) => logger.error(`Failed to queue siteApi ${api.id}`, { siteId: site.id, error: err })),
          );
        });

        const chunkSize = 20;
        for (let i = 0; i < allJobPromises.length; i += chunkSize) {
          await Promise.all(allJobPromises.slice(i, i + chunkSize));
        }
        page++;
      }

      logger.info("Site monitoring completed");
    } catch (error) {
      logger.error("Site monitoring failed", { error });
    }
  }

  private async queueSiteApiJob(site: Site, siteApi: SiteApi): Promise<void> {
    const jobData: SiteMoniorDTO = {
      siteId: site.id,
      siteApiId: siteApi.id,
      completeUrl: normalizeUrl(site.url + (siteApi.path ? `/${siteApi.path}` : "")),
      body: siteApi.body,
      headers: siteApi.headers,
      httpMethod: siteApi.httpMethod,
      maxResponseTime: siteApi.maxResponseTime,
      priority: siteApi.priority,
      siteNotification: site.notification,
      maxNumberOfAttempts: siteApi.maxNumberOfAttempts || 3,
      notification: {
        emailEnabled: siteApi.notificationSetting?.emailEnabled,
        emailAddress: siteApi.notificationSetting?.emailAddress,
        discordEnabled: siteApi.notificationSetting?.discordEnabled,
        discordWebhook: siteApi.notificationSetting?.discordWebhook,
        slackEnabled: siteApi.notificationSetting?.slackEnabled,
        slackWebhook: siteApi.notificationSetting?.slackWebhook,
        notificationFrequency: siteApi.notificationSetting?.notificationFrequency,
        lastSentNotificationAt: siteApi.notificationSetting?.lastNotificationSentAt,
      },
      userId: site.userId,
    };

    await this.siteMonitorQueue.add("monitor-site-api", jobData, {
      attempts: siteApi.maxNumberOfAttempts || 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: true,
      jobId: `${site.id}-${siteApi.id}-${Date.now()}`,
    });
  }
}
