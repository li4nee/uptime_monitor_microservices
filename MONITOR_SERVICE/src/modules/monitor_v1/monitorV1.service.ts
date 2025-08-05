import { Site } from "../../entity/site.entity";
import { SiteApi } from "../../entity/siteApi.entity";
import { siteNotificationSetting } from "../../entity/siteNotificationSetting.entity";
import { SiteModel } from "../../repo/site.repo";
import { SiteApiModel } from "../../repo/siteApi.repo";
import { SiteMonitoringHistoryModel } from "../../repo/siteHistory.repo";
import { DefaultResponse, InvalidInputError, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../../typings/base.type";
import { getPaginationValues } from "../../utils/base.utils";
import { logger } from "../../utils/logger.utils";
import {
  AddMonitoringRoutesDto,
  GetMonitoringHisoryDto,
  GetMonitoringRoutesDto,
  GetOneMonthOverviewDto,
  UpdateMonitoringRoutesDto,
} from "./monitorV1.dto";
class MonitorServiceClass {
  constructor(
    private readonly siteModel = SiteModel,
    private readonly siteApiModel = SiteApiModel,
    private readonly siteHistoryModel = SiteMonitoringHistoryModel,
  ) {}

  async resisterRoutesApiToMonitor(body: AddMonitoringRoutesDto, userId: string): Promise<DefaultResponse> {
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
      siteApi.path = api.path;
      siteApi.httpMethod = api.httpMethod;
      siteApi.headers = api.headers ?? {};
      siteApi.body = api.body ?? {};
      siteApi.maxResponseTime = api.maxResponseTime ?? 5000;
      siteApi.maxNumberOfAttempts = api.maxNumberOfAttempts ?? 3;
      siteApi.priority = api.priority ?? SITE_PRIORITY.MEDIUM;
      siteApi.isActive = api.isActive ?? true;
      const notificationSetting = new siteNotificationSetting();
      notificationSetting.emailEnabled = api.emailEnabled ?? true;
      notificationSetting.emailAddress = api.emailAddress ?? "";
      notificationSetting.discordEnabled = api.discordEnabled ?? false;
      notificationSetting.discordWebhook = api.discordWebhook ?? "";
      notificationSetting.slackEnabled = api.slackEnabled ?? false;
      notificationSetting.slackWebhook = api.slackWebhook ?? "";
      notificationSetting.notificationFrequency = api.notificationFrequency ?? NOTIFICATION_FREQUENCY.ONCE;
      notificationSetting.lastNotificationSentAt = null;
      siteApi.notificationSetting = notificationSetting;
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

  async updateMonitoringRoutes(body: UpdateMonitoringRoutesDto, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to update monitoring routes");

    if (!body.siteId) {
      logger.warn("Site ID is required to update monitoring routes", {
        userId,
        timestamp: new Date().toISOString(),
        action: "update monitoring routes",
        body,
      });
      throw new InvalidInputError("Site ID is required to update monitoring routes", true);
    }

    const site = await this.siteModel.findOne({
      where: { id: body.siteId, userId },
      relations: ["siteApis", "siteApis.notificationSetting"],
    });
    if (!site) {
      logger.warn("Site not found for update", {
        userId,
        siteId: body.siteId,
        timestamp: new Date().toISOString(),
        body,
      });
      throw new InvalidInputError("Site not found for this user", true);
    }
    if (!site.siteApis) {
      site.siteApis = [];
    }
    if (body.url) {
      const existingSite = await this.checkIfTheUrlExists(body.url, userId);
      if (existingSite && existingSite.id !== body.siteId) {
        logger.warn("Attempt to update URL to an existing one", {
          userId,
          url: body.url,
          existingSiteId: existingSite.id,
          timestamp: new Date().toISOString(),
          body,
        });
        throw new InvalidInputError("This URL is already registered for another site.", true);
      }
      site.url = body.url;
    }
    if (body.siteName) site.siteName = body.siteName;
    if (typeof body.isActive === "boolean") site.isActive = body.isActive;
    if (typeof body.siteNotification === "boolean") site.notification = body.siteNotification;

    if (Array.isArray(body.siteApis)) {
      for (const apiInput of body.siteApis) {
        let siteApi: SiteApi | undefined;

        if (apiInput.siteApiId) {
          siteApi = site.siteApis.find((api) => api.id === apiInput.siteApiId);
          if (!siteApi) {
            logger.warn("Site API not found for update", {
              userId,
              siteApiId: apiInput.siteApiId,
              siteId: body.siteId,
              timestamp: new Date().toISOString(),
            });
            throw new InvalidInputError(`Site API not found for ID ${apiInput.siteApiId}`, true);
          }
        } else {
          // No siteApiId means new API
          siteApi = new SiteApi();
          siteApi.site = site;
          siteApi.notificationSetting = new siteNotificationSetting();
          site.siteApis.push(siteApi);
        }
        siteApi.path = apiInput.path ?? siteApi.path;
        siteApi.httpMethod = apiInput.httpMethod ?? siteApi.httpMethod;
        siteApi.headers = apiInput.headers ?? {};
        siteApi.body = apiInput.body ?? {};
        siteApi.maxResponseTime = apiInput.maxResponseTime ?? 5000;
        siteApi.maxNumberOfAttempts = apiInput.maxNumberOfAttempts ?? 3;
        siteApi.priority = apiInput.priority ?? SITE_PRIORITY.MEDIUM;
        siteApi.isActive = apiInput.isActive ?? true;
        siteApi.notificationSetting.emailEnabled = apiInput.emailEnabled ?? true;
        siteApi.notificationSetting.emailAddress = apiInput.emailAddress ?? "";
        siteApi.notificationSetting.discordEnabled = apiInput.discordEnabled ?? false;
        siteApi.notificationSetting.discordWebhook = apiInput.discordWebhook ?? "";
        siteApi.notificationSetting.slackEnabled = apiInput.slackEnabled ?? false;
        siteApi.notificationSetting.slackWebhook = apiInput.slackWebhook ?? "";
        siteApi.notificationSetting.notificationFrequency = apiInput.notificationFrequency ?? NOTIFICATION_FREQUENCY.ONCE;
        siteApi.notificationSetting.lastNotificationSentAt = null;
      }
    }

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

  async getMonitoringHistory(query: GetMonitoringHisoryDto, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to fetch monitoring history");
    if (!(query.siteId && query.siteApiId) && !query.monitoringHistoryId)
      throw new InvalidInputError("Either siteId and siteApiId or monitoringHistoryId must be provided");
    if (query.startDate && query.startDate.getTime() > Date.now()) throw new InvalidInputError("startDate cannot be in the future");
    if (query.endDate && query.endDate.getTime() > Date.now()) throw new InvalidInputError("endDate cannot be in the future");
    if (query.startDate && query.endDate && query.startDate.getTime() > query.endDate.getTime())
      throw new InvalidInputError("startDate cannot be after endDate");
    if (query.monitoringHistoryId) {
      const history = await this.siteHistoryModel.findOne({
        where: {
          id: query.monitoringHistoryId,
        },
      });
      if (!history) {
        logger.warn("Monitoring history not found", {
          userId,
          monitoringHistoryId: query.monitoringHistoryId,
          siteApiId: query.siteApiId,
          siteId: query.siteId,
          timestamp: new Date().toISOString(),
        });
        throw new InvalidInputError("Monitoring history not found", true);
      }
      logger.info("Monitoring history fetched successfully", {
        userId,
        monitoringHistoryId: query.monitoringHistoryId,
        siteApiId: query.siteApiId,
        siteId: query.siteId,
        timestamp: new Date().toISOString(),
      });
      return new DefaultResponse(200, "Monitoring history fetched successfully", {
        history: [history],
        pagination: null,
      });
    }
    let { skip, limit } = getPaginationValues(query.page || 0, query.limit || 10);
    let queryBuilder = this.siteHistoryModel
      .createQueryBuilder("history")
      .leftJoin("history.siteApi", "siteApi")
      .leftJoin("siteApi.site", "site")
      .where("site.id = :siteId", { siteId: query.siteId })
      .andWhere("siteApi.id = :siteApiId", { siteApiId: query.siteApiId })
      .select(["history.id", "history.status", "history.responseTime", "history.checkedAt", "history.wasNotificationSent", "history.httpMethod"])
      .orderBy("history.checkedAt", "DESC")
      .take(limit)
      .skip(skip);
    if (query.status) queryBuilder.andWhere("history.status = :status", { status: query.status });

    if (query.startDate) queryBuilder.andWhere("history.checkedAt >= :startDate", { startDate: query.startDate });

    if (query.endDate) queryBuilder.andWhere("history.checkedAt <= :endDate", { endDate: query.endDate });

    if (query.httpMethod) queryBuilder.andWhere("history.httpMethod = :httpMethod", { httpMethod: query.httpMethod });
    const [history, total] = await queryBuilder.getManyAndCount();
    let totalPages = Math.ceil(total / limit);
    logger.info("Monitoring history fetched successfully", {
      userId,
      siteId: query.siteId,
      siteApiId: query.siteApiId,
      total,
      page: query.page || 0,
      limit,
      totalPages,
      timestamp: new Date().toISOString(),
    });
    return new DefaultResponse(200, "Monitoring history fetched successfully", {
      history,
      pagination: {
        total,
        page: query.page || 0,
        totalPages,
      },
    });
  }

  async getOneMonthOverview(query: GetOneMonthOverviewDto, userId: string) {
    const { siteId, siteApiId, yearAndMonth } = query;
    if (!userId) throw new InvalidInputError("User ID is required to fetch one month overview");
    if (!siteId) throw new InvalidInputError("Site ID is required");
    if (!siteApiId) throw new InvalidInputError("Site API ID is required");
    if (!yearAndMonth?.match(/^\d{4}-\d{2}$/)) throw new InvalidInputError("yearAndMonth must be in YYYY-MM format");
    const [year, month] = yearAndMonth.split("-").map((str) => Number(str));
    if (month < 1 || month > 12 || isNaN(year) || isNaN(month)) throw new InvalidInputError("Invalid year or month");
    const startDate = new Date(year, month - 1, 1); // JavaScript months are 0-indexed tei bhara month bata ek ghatako
    const endDate = new Date(year, month, 0); // Last day of the month
    if (startDate.getTime() > Date.now() || endDate.getTime() > Date.now()) throw new InvalidInputError("Dates cannot be in the future");
    const queryBuilder = this.siteHistoryModel
      .createQueryBuilder("history")
      .innerJoin("history.siteApi", "siteApi")
      .innerJoin("siteApi.site", "site")
      .where("site.id = :siteId", { siteId })
      .andWhere("site.userId = :userId", { userId })
      .andWhere("siteApi.id = :siteApiId", { siteApiId })
      .andWhere("history.checkedAt BETWEEN :startDate AND :endDate", { startDate, endDate });

    const results = await queryBuilder
      .select([
        `DATE_TRUNC('day', history.checkedAt) AS day`,
        `COUNT(*) AS total`,
        `SUM(CASE WHEN history.status = 'UP' THEN 1 ELSE 0 END) AS up`,
        `SUM(CASE WHEN history.status = 'DOWN' THEN 1 ELSE 0 END) AS down`,
        `AVG(history.responseTime) AS avgResponseTime`,
      ])
      .groupBy(`day`)
      .orderBy(`day`, "ASC")
      .getRawMany();
    const dailyStatsMap: Record<string, any> = {};
    results.forEach((row) => {
      const dayKey = new Date(row.day).toISOString().split("T")[0];
      dailyStatsMap[dayKey] = {
        total: Number(row.total),
        up: Number(row.up),
        down: Number(row.down),
        averageResponseTime: row.avgResponseTime ? Math.round(Number(row.avgResponseTime)) : null,
        uptimePercentage: row.total > 0 ? Math.round((Number(row.up) / Number(row.total)) * 100) : null,
      };
    });
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar: any[] = [];
    let upCount = 0;
    let downCount = 0;
    let totalResponseTime = 0;
    let totalCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day); // current month dincha
      const key = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      const stat = dailyStatsMap[key]; // check if data exists for this day

      if (stat) {
        upCount += stat.up;
        downCount += stat.down;
        totalResponseTime += stat.averageResponseTime * stat.total;
        totalCount += stat.total;
      }

      calendar.push({
        date: key,
        upChecks: stat?.up ?? 0,
        downChecks: stat?.down ?? 0,
        totalChecks: stat?.total ?? 0,
        averageResponseTime: stat?.averageResponseTime ?? null,
        uptimePercentage: stat?.uptimePercentage ?? null,
      });
    }

    const averageResponseTime = totalCount > 0 ? Math.round(totalResponseTime / totalCount) : null;
    logger.info("One month overview fetched successfully", {
      userId,
      siteId,
      siteApiId,
      yearAndMonth,
      averageResponseTime,
      upCount,
      downCount,
      totalResponseTime,
      calendarLength: calendar.length,
      timestamp: new Date().toISOString(),
    });
    return new DefaultResponse(200, "One month overview fetched successfully", {
      overview: {
        averageResponseTime,
        upCount,
        downCount,
        totalResponseTime,
        calendar,
      },
      pagination: null,
    });
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

export const MonitorService = new MonitorServiceClass();
