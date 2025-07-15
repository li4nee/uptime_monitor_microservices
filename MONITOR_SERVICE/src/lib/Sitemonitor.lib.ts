import { Site } from "../entity/site.entity";
import { SiteApi } from "../entity/siteApi.entity";
import { SiteModel } from "../repo/site.repo";
import { SiteMoniorDTO } from "../typings/base.type";
import { SiteMonitorQueue } from "./queue/sitemonitor.queue";

export class SiteMonitorService {
  constructor(
    private readonly siteModel = SiteModel,
    private readonly siteMonitorQueue = SiteMonitorQueue,
  ) {}

  async monitorTheSites(): Promise<void> {
    const sites = await this.siteModel.find({
      where: { trash: false, siteApis: { isActive: true } },
      relations: { siteApis: true },
      select: {
        id: true,
        url: true,
        userId: true,
        siteApis: {
          id: true,
          body: true,
          headers: true,
          httpMethod: true,
          maxResponseTime: true,
          priority: true,
          notification: true,
          notificationFrequency: true,
          lastNotificationSentAt: true,
        },
      },
    });

    if (!sites?.length) {
      return;
    }

    const allJobPromises = sites.flatMap((site) => {
      if (!site.siteApis?.length) return [];

      return site.siteApis.map((api) =>
        this.queueSiteApiJob(site, api).catch((err) =>
          console.error(`Failed to queue job for siteApi ${api.id}:`, err),
        ),
      );
    });

    await Promise.all(allJobPromises);
  }

  private async queueSiteApiJob(site: Site, siteApi: SiteApi): Promise<void> {
    const jobData: SiteMoniorDTO = {
      siteId: site.id,
      siteApiId: siteApi.id,
      url: site.url,
      body: siteApi.body,
      headers: siteApi.headers,
      httpMethod: siteApi.httpMethod,
      maxResponseTime: siteApi.maxResponseTime,
      priority: siteApi.priority,
      notification: siteApi.notification,
      notificationFrequency: siteApi.notificationFrequency,
      lastSentNotificationAt: siteApi.lastNotificationSentAt,
      userId: site.userId,
    };
    this.siteMonitorQueue
      .add("monitor-site-api", jobData, {
        attempts: siteApi.maxNumberOfAttempts || 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId: `${site.id}-${siteApi.id}`,
      })
      .catch((error) => {
        console.error(`Failed to add job for siteApi ${siteApi.id}:`, error);
      });
  }
}
