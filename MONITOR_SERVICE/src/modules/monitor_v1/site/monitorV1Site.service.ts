import { Site } from "../../../entity/site.entity";
import { SiteApi } from "../../../entity/siteApi.entity";
import { siteNotificationSetting } from "../../../entity/siteNotificationSetting.entity";
import { SiteModel } from "../../../repo/site.repo";
import { SiteApiModel } from "../../../repo/siteApi.repo";
import {
  DefaultResponse,
  HTTP_METHOD,
  InvalidInputError,
  NOTIFICATION_FREQUENCY,
  NotificationData,
  ResourceNotFoundError,
  SITE_PRIORITY,
} from "../../../typings/base.type";
import { getPaginationValues, normalizePath } from "../../../utils/base.utils";
import { logger } from "../../../utils/logger.utils";
import { AddMonitoringSiteDto, AddNewSiteApiDto, EditExistingSiteApiDto, GetMonitoringRoutesDto, UpdateMonitoringSiteDto } from "./monitorV1Site.dto";
class SiteServiceClass {
  constructor(
    private readonly siteModel = SiteModel,
    private readonly siteApiModel = SiteApiModel,
  ) {}

  async resisterRoutesApiToMonitor(body: AddMonitoringSiteDto, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to register monitoring routes");
    let existingSite = await this.checkIfTheUrlExists(body.url, userId);
    if (existingSite) {
      logger.warn("Attempt to register existing URL for monitoring", {
        userId,
        url: body.url,
        timestamp: new Date().toISOString(),
        existingSiteId: existingSite.id,
      });
      throw new InvalidInputError("This URL is already registered for monitoring,please edit the existing site instead of creating a new one", true);
    }
    let newSite = new Site();
    newSite.url = body.url;
    newSite.userId = userId;
    newSite.siteName = body.siteName ?? "";
    newSite.notification = body.siteNotification ?? true;
    newSite.siteApis = body.siteApis?.map((api) => {
      let siteApi = new SiteApi();
      siteApi.path = api.path.trim().replace(/\/+$/, "");
      siteApi.httpMethod = api.httpMethod;
      siteApi.headers = api.headers ?? {};
      siteApi.body = api.body ?? {};
      siteApi.maxResponseTime = api.maxResponseTime ?? 5000;
      siteApi.maxNumberOfAttempts = api.maxNumberOfAttempts ?? 3;
      siteApi.priority = api.priority ?? SITE_PRIORITY.MEDIUM;
      siteApi.isActive = api.isActive ?? true;
      let notificationData: NotificationData = {
        emailEnabled: api.notificationSetting.emailEnabled,
        emailAddress: api.notificationSetting.emailAddress,
        discordEnabled: api.notificationSetting.discordEnabled,
        discordWebhook: api.notificationSetting.discordWebhook,
        slackEnabled: api.notificationSetting.slackEnabled,
        slackWebhook: api.notificationSetting.slackWebhook,
      };
      this.checkIfNotificationSettingsIsCorrect(notificationData);
      siteApi.notificationSetting = this.mapNotificationSettings(api);
      return siteApi;
    });
    await this.siteModel.save(newSite);
    logger.info("Monitoring routes registered successfully", {
      userId,
      siteId: newSite.id,
      url: newSite.url,
      siteName: newSite.siteName,
      timestamp: new Date().toISOString(),
    });
    return new DefaultResponse(200, "Monitoring routes registered successfully");
  }

  async getMonitoringRoutes(query: GetMonitoringRoutesDto, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to fetch monitoring routes");
    if (query.siteId || query.siteApiId) return await this.getMonitoringRouteIdProvided(query, userId);
    return await this.getMonitoringRoutesPaginated(query, userId);
  }

  async updateMonitoringSite(body: UpdateMonitoringSiteDto, siteId: string, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to update monitoring routes");

    if (!siteId) {
      logger.warn("Site ID is required to update monitoring routes", {
        userId,
        timestamp: new Date().toISOString(),
        action: "update monitoring routes",
        body,
      });
      throw new InvalidInputError("Site ID is required to update monitoring routes", true);
    }

    const site = await this.siteModel.findOne({
      where: { id: siteId, userId },
    });
    if (!site) {
      logger.warn("Site not found for update", {
        userId,
        siteId: siteId,
        timestamp: new Date().toISOString(),
        body,
      });
      throw new ResourceNotFoundError("Site not found for this user", true);
    }
    if (body.url) {
      const existingSite = await this.checkIfTheUrlExists(body.url, userId);
      if (existingSite && existingSite.id !== siteId) {
        logger.warn("This URL is already registered for another site by this user.", {
          userId,
          url: body.url,
          existingSiteId: existingSite.id,
          timestamp: new Date().toISOString(),
          body,
        });
        throw new InvalidInputError("You have already registered this URL for another site.", true);
      }
      site.url = body.url;
    }
    if (body.siteName) site.siteName = body.siteName;
    if (typeof body.isActive === "boolean") site.isActive = body.isActive;
    if (typeof body.siteNotification === "boolean") site.notification = body.siteNotification;

    await this.siteModel.save(site);
    logger.info("Monitoring routes updated successfully", {
      userId,
      siteId: site.id,
      url: site.url,
      siteName: site.siteName,
      timestamp: new Date().toISOString(),
    });
    return new DefaultResponse(200, "Monitoring routes updated successfully");
  }

  async deleteMonitoringSite(siteId: string, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to delete monitoring routes");
    if (!siteId) {
      logger.warn("Site ID is required to delete monitoring routes", {
        userId,
        timestamp: new Date().toISOString(),
      });
      throw new InvalidInputError("Site ID is required to delete monitoring routes", true);
    }
    const site = await this.siteModel.findOne({ where: { id: siteId, userId }, select: ["id", "url", "siteName"] });
    if (!site) {
      logger.warn("Site not found for deletion", {
        userId,
        siteId,
        timestamp: new Date().toISOString(),
      });
      throw new ResourceNotFoundError("Site not found for this user", true);
    }
    await this.siteModel.remove(site);
    logger.info("Monitoring site deleted successfully", {
      userId,
      siteId: site.id,
      url: site.url,
      siteName: site.siteName,
      timestamp: new Date().toISOString(),
    });
    return new DefaultResponse(200, "Monitoring site deleted successfully");
  }

  async editExistingSiteApi(body: EditExistingSiteApiDto, siteId: string, siteApiId: string, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to edit existing site API");
    if (!siteId || !siteApiId) {
      logger.warn("Site ID and Site API ID are required to edit existing site API", {
        userId,
        timestamp: new Date().toISOString(),
        body,
      });
      throw new InvalidInputError("Site ID and Site API ID are required to edit existing site API", true);
    }
    let api = await this.siteApiModel.findOne({
      where: { id: siteApiId, site: { id: siteId, userId } },
      relations: ["notificationSetting"],
    });
    if (!api) {
      logger.warn("Site API not found for edit", {
        userId,
        siteApiId: siteApiId,
        siteId: siteId,
        timestamp: new Date().toISOString(),
        body,
      });
      throw new ResourceNotFoundError("Site API not found for this site and user", true);
    }
    if (body.path || body.httpMethod)
      this.checkIfTheEndpointAlreadyExists(body.path || api.path, body.httpMethod || api.httpMethod, siteId, siteApiId, userId);
    if (body.path) api.path = normalizePath(body.path);
    if (body.httpMethod) api.httpMethod = body.httpMethod;
    if (body.headers) api.headers = body.headers;
    if (body.body) api.body = body.body;
    if (typeof body.maxResponseTime === "number") api.maxResponseTime = body.maxResponseTime;
    if (typeof body.maxNumberOfAttempts === "number") api.maxNumberOfAttempts = body.maxNumberOfAttempts;
    if (typeof body.priority === "number") api.priority = body.priority;
    if (typeof body.isActive === "boolean") api.isActive = body.isActive;

    if (body.notificationSetting) {
      let notificationData: NotificationData = {
        emailEnabled: body.notificationSetting.emailEnabled,
        emailAddress: body.notificationSetting.emailAddress,
        discordEnabled: body.notificationSetting.discordEnabled,
        discordWebhook: body.notificationSetting.discordWebhook,
        slackEnabled: body.notificationSetting.slackEnabled,
        slackWebhook: body.notificationSetting.slackWebhook,
      };
      this.checkIfNotificationSettingsIsCorrect(notificationData);
      api.notificationSetting = this.mapNotificationSettings(body.notificationSetting);
    }
    await this.siteApiModel.save(api);
    logger.info("Site API updated successfully", {
      userId,
      siteApiId: api.id,
      siteId: siteId,
    });
    return new DefaultResponse(200, "Site API updated successfully");
  }

  async addSiteApi(body: AddNewSiteApiDto, siteId: string, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to add new site API");
    if (!siteId) {
      logger.warn("Site ID is required to add new site API", {
        userId,
        timestamp: new Date().toISOString(),
        body,
      });
      throw new InvalidInputError("Site ID is required to add new site API", true);
    }
    const site = await this.siteModel.findOne({
      where: { id: siteId, userId },
      relations: ["siteApis", "siteApis.notificationSetting"],
    });
    if (!site) {
      logger.warn("Site not found for adding new API", {
        userId,
        siteId: siteId,
        timestamp: new Date().toISOString(),
        body,
      });
      throw new ResourceNotFoundError("Site not found for this user", true);
    }
    if (!site.siteApis) {
      site.siteApis = [];
    }
    for (const api of body.siteApis) {
      this.checkIfTheEndpointAlreadyExists(api.path, api.httpMethod, siteId, "", userId);
      let siteApi = new SiteApi();
      siteApi.path = normalizePath(api.path);
      siteApi.httpMethod = api.httpMethod;
      siteApi.headers = api.headers ?? {};
      siteApi.body = api.body ?? {};
      siteApi.maxResponseTime = api.maxResponseTime ?? 5000;
      siteApi.maxNumberOfAttempts = api.maxNumberOfAttempts ?? 3;
      siteApi.priority = api.priority ?? SITE_PRIORITY.MEDIUM;
      siteApi.isActive = api.isActive ?? true;
      let notificationData: NotificationData = {
        emailEnabled: api.notificationSetting.emailEnabled,
        emailAddress: api.notificationSetting.emailAddress,
        discordEnabled: api.notificationSetting.discordEnabled,
        discordWebhook: api.notificationSetting.discordWebhook,
        slackEnabled: api.notificationSetting.slackEnabled,
        slackWebhook: api.notificationSetting.slackWebhook,
      };
      this.checkIfNotificationSettingsIsCorrect(notificationData);
      siteApi.notificationSetting = this.mapNotificationSettings(api);
      site.siteApis.push(siteApi);
    }
    await this.siteModel.save(site);
    logger.info("New site API added successfully", {
      userId,
      siteId: site.id,
      url: site.url,
      timestamp: new Date().toISOString(),
    });
    return new DefaultResponse(200, "New site API added successfully");
  }

  async deleteSiteApi(siteId: string, siteApiId: string, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to delete site API");
    if (!siteId || !siteApiId) {
      logger.warn("Site ID and Site API ID are required to delete site API", {
        userId,
        timestamp: new Date().toISOString(),
        siteId,
        siteApiId,
      });
      throw new InvalidInputError("Site ID and Site API ID are required to delete site API", true);
    }
    const result = await this.siteApiModel.delete({
      id: siteApiId,
      site: { id: siteId, userId },
    });

    if (result.affected === 0) {
      logger.warn("No site API found to delete", {
        userId,
        siteId,
        siteApiId,
      });
      throw new ResourceNotFoundError("Site API not found for this site and user", true);
    }

    logger.info("Site API deleted successfully", {
      userId,
      siteId,
      siteApiId,
    });

    return new DefaultResponse(200, "Site API deleted successfully");
  }

  private mapNotificationSettings(apiInput: any): siteNotificationSetting {
    const setting = new siteNotificationSetting();
    setting.emailEnabled = apiInput.emailEnabled ?? false;
    setting.emailAddress = apiInput.emailAddress ?? "";
    setting.discordEnabled = apiInput.discordEnabled ?? false;
    setting.discordWebhook = apiInput.discordWebhook ?? "";
    setting.slackEnabled = apiInput.slackEnabled ?? false;
    setting.slackWebhook = apiInput.slackWebhook ?? "";
    setting.notificationFrequency = apiInput.notificationFrequency ?? NOTIFICATION_FREQUENCY.ONCE;
    setting.lastNotificationSentAt = null;
    return setting;
  }

  private async checkIfNotificationSettingsIsCorrect(notiData: NotificationData): Promise<void> {
    if (notiData.emailEnabled && !notiData.emailAddress)
      throw new InvalidInputError("Email address is required when email notifications are enabled", true);
    if (notiData.discordEnabled && !notiData.discordWebhook)
      throw new InvalidInputError("Discord webhook is required when Discord notifications are enabled", true);
    if (notiData.slackEnabled && !notiData.slackWebhook)
      throw new InvalidInputError("Slack webhook is required when Slack notifications are enabled", true);
  }

  private async checkIfTheEndpointAlreadyExists(
    path: string,
    httpMethod: HTTP_METHOD,
    siteId: string,
    siteApiId: string,
    userId: string,
  ): Promise<void> {
    let siteApi = await this.siteApiModel.findOne({
      where: { site: { id: siteId, userId }, path, httpMethod },
      select: { id: true },
    });
    if (siteApi && siteApi.id !== siteApiId) {
      logger.warn("Attempt to register existing endpoint for monitoring", {
        userId,
        path,
        httpMethod,
        siteId,
        siteApiId,
        timestamp: new Date().toISOString(),
      });
      throw new InvalidInputError(
        "This endpoint is already registered for monitoring, please edit the existing API instead of creating a new one",
        true,
      );
    }
  }

  private async getMonitoringRoutesPaginated(query: GetMonitoringRoutesDto, userId: string): Promise<DefaultResponse> {
    let { limit, skip } = getPaginationValues(query.page || 0, query.limit || 10);
    let queryBuilder = this.siteModel
      .createQueryBuilder("site")
      .leftJoin("site.siteApis", "siteApi")
      .where("site.userId = :userId", { userId: userId })
      .select(["site.id", "site.url", "site.siteName", "site.isActive", "site.createdAt", "site.notification"])
      .take(limit)
      .skip(skip)
      .orderBy(`site.${query.orderBy ?? "createdAt"}`, query.order ?? "DESC");

    if (query.siteNotification)
      queryBuilder.andWhere("site.notification = :siteNotification", {
        siteNotification: query.siteNotification,
      });

    if (query.isActive) queryBuilder.andWhere("site.isActive = :isActive", { isActive: query.isActive });

    if (query.priority) queryBuilder.andWhere("siteApi.priority = :priority", { priority: query.priority });

    if (query.httpMethod) queryBuilder.andWhere("siteApi.httpMethod = :httpMethod", { httpMethod: query.httpMethod });

    if (query.search)
      queryBuilder.andWhere("(site.url ILIKE :search OR site.siteName ILIKE :search OR siteApi.path ILIKE :search)", { search: `%${query.search}%` });
    const [sites, total] = await queryBuilder.getManyAndCount();
    let totalPages = Math.ceil(total / limit);

    return new DefaultResponse(200, "Monitoring routes fetched successfully", {
      sites,
      pagination: {
        total,
        page: query.page || 0,
        limit: limit,
        totalPages: totalPages,
      },
    });
  }

  private async getMonitoringRouteIdProvided(query: GetMonitoringRoutesDto, userId: string): Promise<DefaultResponse> {
    const { siteId, siteApiId } = query;

    if (siteApiId && !siteId) {
      const siteApi = await this.findSiteApiWithSite(siteApiId, userId);
      if (!siteApi) {
        logger.warn("Site API not found for user", {
          userId,
          siteApiId,
          timestamp: new Date().toISOString(),
        });
        throw new InvalidInputError("Site API not found for this user", true);
      }
      const { site, ...rest } = siteApi;
      return new DefaultResponse(200, "Monitoring route fetched successfully", {
        site: site,
        siteApis: [rest],
        pagination: null,
      });
    }

    if (!siteId) {
      throw new InvalidInputError("Site ID is required to fetch monitoring routes");
    }

    const sitePromise = this.findSiteById(siteId, userId);

    if (siteApiId) {
      const [site, siteApi] = await Promise.all([sitePromise, this.findSiteApi(siteApiId, siteId, userId)]);

      if (!site) throw new InvalidInputError("Site not found");
      if (!siteApi) throw new InvalidInputError("Site API not found for this site and user");

      return new DefaultResponse(200, "Monitoring route fetched successfully", {
        site,
        siteApis: [siteApi],
        pagination: null,
      });
    }

    let page = query.page || 0;
    let limit = query.limit || 10;
    let skip = page * limit;

    const [site, [siteApis, total]] = await Promise.all([
      sitePromise,
      this.siteApiModel.findAndCount({
        where: { site: { id: siteId, userId } },
        select: this.siteApiSelectFields(),
        order: { priority: query.order ?? "DESC" },
        skip,
        take: limit,
      }),
    ]);

    if (!site) throw new InvalidInputError("Site not found");

    return new DefaultResponse(200, "Monitoring route fetched successfully", {
      site,
      siteApis,
      pagination: {
        total,
        page,
        limit,
      },
    });
  }

  private findSiteById(siteId: string, userId: string): Promise<Site | null> {
    return this.siteModel.findOne({
      where: { id: siteId, userId },
      select: {
        id: true,
        url: true,
        siteName: true,
        isActive: true,
        createdAt: true,
        notification: true,
      },
    });
  }

  private findSiteApi(siteApiId: string, siteId: string, userId: string): Promise<SiteApi | null> {
    return this.siteApiModel.findOne({
      where: {
        id: siteApiId,
        site: { id: siteId, userId },
      },
      select: this.siteApiSelectFields(),
      relations: { notificationSetting: true },
    });
  }

  private findSiteApiWithSite(siteApiId: string, userId: string): Promise<SiteApi | null> {
    return this.siteApiModel.findOne({
      where: {
        id: siteApiId,
        site: { userId },
      },
      relations: { site: true, notificationSetting: true },
      select: {
        ...this.siteApiSelectFields(),
        site: {
          id: true,
          url: true,
          notification: true,
          siteName: true,
          isActive: true,
          createdAt: true,
        },
      },
    });
  }

  private siteApiSelectFields(): any {
    return {
      id: true,
      path: true,
      httpMethod: true,
      isActive: true,
      priority: true,
      notificationSetting: {
        id: true,
        emailEnabled: true,
        emailAddress: true,
        discordEnabled: true,
        discordWebhook: true,
        slackEnabled: true,
        slackWebhook: true,
        notificationFrequency: true,
        lastNotificationSentAt: true,
      },
      headers: true,
      body: true,
      maxResponseTime: true,
      maxNumberOfAttempts: true,
    };
  }

  private async checkIfTheUrlExists(url: string, userId: string): Promise<Site | null> {
    const site = await this.siteModel.findOne({
      where: { url, userId },
      select: { id: true },
    });
    return site;
  }
}

export const SiteService = new SiteServiceClass();
