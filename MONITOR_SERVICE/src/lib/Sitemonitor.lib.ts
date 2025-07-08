import { connectToRedis } from "../dbconfig"
import { Site } from "../entity/site.entity"
import { SiteApi } from "../entity/siteApi.entity"
import { SiteModel } from "../repo/site.repo"
import { SiteApiModel } from "../repo/siteApi.repo"
import { SiteMonitoringHistoryModel } from "../repo/siteHistory.repo"
import { SiteMonitorQueue } from "./jobs/sitemonitor.jobs"

export class SiteMonitorService {
    private redisInstance!: Awaited<ReturnType<typeof connectToRedis>>
    
    constructor(
    private readonly siteModel = SiteModel,
    private readonly siteApiModel = SiteApiModel,
    private readonly siteHistoryModel = SiteMonitoringHistoryModel,
    private readonly siteMonitorQueue = SiteMonitorQueue
  ) {
  }

  async init() {
    this.redisInstance = await connectToRedis()
    if (!this.redisInstance) {
      console.error("Failed to connect to Redis")
    }
  }

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
    })

    if (!sites?.length) {
      console.log("No sites to monitor")
      return
    }
    //.map() would return: [ [Promise, Promise], [Promise] ]
    //.flatMap() returns: [ Promise, Promise, Promise ]

    const allJobPromises = sites.flatMap((site) => {
    if (!site.siteApis?.length) return [];

    return site.siteApis.map((api) =>
    this.queueSiteApiJob(site, api).catch((err) =>
      console.error(`Failed to queue job for siteApi ${api.id}:`, err)
    )
    );
    });

    await Promise.all(allJobPromises);
}

  private async queueSiteApiJob(site:Site, siteApi: SiteApi): Promise<void> {
    const jobData = {
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
    this.siteMonitorQueue.add("monitor-site-api", jobData).catch((error) => {
        console.error(`Failed to add job for siteApi ${siteApi.id}:`, error);
    });
}

}
