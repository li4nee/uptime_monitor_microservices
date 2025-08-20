import { SiteModel } from "../../../repo/site.repo";
import { SiteApiModel } from "../../../repo/siteApi.repo";
import { SiteSLAReportModel } from "../../../repo/siteDailySLAReport.repo";
import { SiteMonitoringHistoryModel } from "../../../repo/siteHistory.repo";
import { DefaultResponse, InvalidInputError, ResourceNotFoundError } from "../../../typings/base.type";
import { getPaginationValues } from "../../../utils/base.utils";
import { cacheUtils } from "../../../utils/cache.utils";
import { logger } from "../../../utils/logger.utils";
import { GetMonitoringHisoryDto, GetOneMonthOverviewDto, GetSLAReportHistoryDto } from "./monitorV1History.dto";

class MonitorHistoryServiceClass {
  constructor(
    private readonly siteHistoryModel = SiteMonitoringHistoryModel,
    private readonly siteSlaReportModel = SiteSLAReportModel,
  ) {}

  async getMonitoringHistory(query: GetMonitoringHisoryDto, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to fetch monitoring history");
    if (!(query.siteId && query.siteApiId) && !query.monitoringHistoryId)
      throw new InvalidInputError("Either siteId and siteApiId or monitoringHistoryId must be provided");
    this.checkDateValidity(query.startDate, query.endDate, false);
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
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    if (startDate.getTime() > Date.now()) throw new InvalidInputError("Dates cannot be in the future");
    let key = `oneMonthOverview:${siteId}:${siteApiId}:${userId}:${yearAndMonth}`;
    const cachedOverview = await cacheUtils.getCache(key);
    if (cachedOverview) {
      return new DefaultResponse(200, "One month overview fetched successfully from cache", {
        overview: cachedOverview,
        pagination: null,
      });
    }
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
    if (results.length == 0) throw new ResourceNotFoundError("No history found for the given API to provide the overview", true);
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
      timestamp: new Date().toISOString(),
    });

    // SAME MONTH CHA BAHNE 5 MINS CACHE HANDIM ANI PURANO MONTH CHA BHANE TAH JATTI STALE BHAYENI KEI FARAK PARDAINA
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const cacheDuration = year === currentYear && month === currentMonth ? 5 * 60 : 24 * 60 * 60;

    await cacheUtils.setCache(
      key,
      {
        averageResponseTime,
        upCount,
        downCount,
        totalResponseTime,
        calendar,
      },
      cacheDuration,
    );
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

  async getSLAreportHistory(query: GetSLAReportHistoryDto, userId: string): Promise<DefaultResponse> {
    if (!userId) throw new InvalidInputError("User ID is required to fetch SLA report history");
    if (query.reportId) {
      const key = `slaReport:${query.reportId}-user:${userId}`;

      const cachedResult = await cacheUtils.getCache(key);
      if (cachedResult) {
        return new DefaultResponse(200, "SLA report fetched successfully", {
          report: cachedResult,
          pagination: null,
        });
      }

      const report = await this.siteSlaReportModel.findOne({
        where: {
          id: query.reportId,
          site: { userId },
        },
      });
      if (!report) throw new ResourceNotFoundError("SLA report not found", true);
      await cacheUtils.setCache(key, report, 5 * 60 * 60);
      return new DefaultResponse(200, "SLA report fetched successfully", {
        report,
        pagination: null,
      });
    }
    if (!query.siteId) throw new InvalidInputError("Either Site ID or Report Id is required");
    this.checkDateValidity(query.startDate, query.endDate, false);
    let { skip, limit } = getPaginationValues(query.page || 0, query.limit || 10);
    let firstPageKey = `paginatedSlaReportModel-siteId:${query.siteId}`;
    const shouldCache = this.isDefaultFirstPage(query);
    if (shouldCache) {
      console.log("cache hit hai hit")
      const cached = await cacheUtils.getCache(firstPageKey);
      if (cached) return new DefaultResponse(200, "SLA report history fetched successfully", cached);
    }
    let builder = this.siteSlaReportModel
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.site", "site")
      .where("site.id = :siteId", { siteId: query.siteId })
      .andWhere("site.userId = :userId", { userId })
      .select([
        "report.id",
        "report.periodStart",
        "report.periodEnd",
        "report.createdAt",
        "report.totalChecks",
        "report.upChecks",
        "report.downChecks",
        "report.uptimePercentage",
      ])
      .skip(skip)
      .take(limit)
      .orderBy(`report.${query.orderBy || "createdAt"}`, query.order || "DESC");

    if (query.startDate) builder.andWhere("report.createdAt >= :startDate", { startDate: query.startDate });
    if (query.endDate) builder.andWhere("report.createdAt <= :endDate", { endDate: query.endDate });

    const [reports, total] = await builder.getManyAndCount();
    if (reports.length === 0) throw new ResourceNotFoundError("No SLA report history found for the given site", true);
    let totalPages = Math.ceil(total / limit);

    const responseData = {
      reports,
      pagination: {
        total,
        page: query.page || 0,
        totalPages: Math.ceil(total / (query.limit || 10)),
        limit: query.limit || 10,
        orderBy: query.orderBy || "createdAt",
        order: query.order || "DESC",
      },
    };

    if (shouldCache) {
      const ttl = this.getDynamicCacheTTL();
      await cacheUtils.setCache(firstPageKey, responseData, ttl);
    }
    logger.info("SLA report history fetched successfully", {
      userId,
      siteId: query.siteId,
      total,
      page: query.page || 0,
      limit,
      totalPages,
      timestamp: new Date().toISOString(),
    });

    return new DefaultResponse(200, "SLA report history fetched successfully", responseData);
  }

  private checkDateValidity(startDate?: Date, endDate?: Date, requiresBoth: boolean = false): void {
    if (requiresBoth && (!startDate || !endDate)) throw new InvalidInputError("Both startDate and endDate are required");

    if (startDate && startDate.getTime() > Date.now()) throw new InvalidInputError("startDate cannot be in the future");

    if (endDate && endDate.getTime() > Date.now()) throw new InvalidInputError("endDate cannot be in the future");

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) throw new InvalidInputError("startDate cannot be after endDate");
  }

  private isDefaultFirstPage = (query: GetSLAReportHistoryDto) =>
    (!query.page || query.page === 0) &&
    (!query.limit || query.limit === 10) &&
    !query.startDate &&
    !query.endDate &&
    (!query.order || query.order === "DESC") &&
    (!query.orderBy || query.orderBy === "createdAt");

  private getDynamicCacheTTL = (): number => {
    const now = new Date();
    const hour = now.getHours();
    let ttlInSeconds: number;

    if (hour === 21) {
      ttlInSeconds = 3 * 60 * 60;
    } else if (hour === 22) {
      ttlInSeconds = 1 * 60 * 60;
    } else if (hour === 23 || hour === 0) {
      ttlInSeconds = 5 * 60;
    } else {
      ttlInSeconds = 4 * 60 * 60;
    }
    return ttlInSeconds;
  };
}

export const MonitorHistoryService = new MonitorHistoryServiceClass();
