import { Site } from "../entity/site.entity";
import { SiteApi } from "../entity/siteApi.entity";
import { SiteModel } from "../repo/site.repo";
import { SiteMoniorDTO } from "../typings/base.type";
import { SiteMonitorQueue } from "./queue/sitemonitor.queue";
import { logger } from "../utils/logger.utils";

export class SiteMonitorService {
  private readonly BatchSize = 100;

  constructor(
    private readonly siteModel = SiteModel,
    private readonly siteMonitorQueue = SiteMonitorQueue,
  ) {}

  async monitorTheSites(): Promise<void> {
    let page = 0;
    try {
      logger.info("Starting site monitoring process");

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
            siteApis: {
              id: true,
              body: true,
              headers: true,
              httpMethod: true,
              maxResponseTime: true,
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

        if (!sites?.length) {
          logger.info(`No more sites to monitor after page ${page}`);
          break;
        }

        logger.info(`Monitoring page ${page}, sites found: ${sites.length}`);

        const allJobPromises = sites.flatMap((site) => {
          if (!site.siteApis?.length) {
            logger.warn(`Site ${site.id} has no active APIs`);
            return [];
          }

          return site.siteApis.map((api) =>
            this.queueSiteApiJob(site, api).catch((err) =>
              logger.error(`Failed to queue job for siteApi ${api.id}`, { error: err }),
            ),
          );
        });

        await Promise.all(allJobPromises);
        page++;
      }

      logger.info("Completed monitoring all sites");
    } catch (error) {
      logger.error("Error monitoring sites", { error });
    }
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
      siteNotification: site.notification,
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

    await this.siteMonitorQueue
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
      .then(() =>
        logger.info(`Queued job for siteApi ${siteApi.id} of site ${site.id}`),
      )
      .catch((error) => {
        logger.error(`Failed to add job for siteApi ${siteApi.id}`, { error });
      });
  }
}
