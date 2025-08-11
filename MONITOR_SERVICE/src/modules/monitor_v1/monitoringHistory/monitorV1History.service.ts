import { SiteModel } from "../../../repo/site.repo";
import { SiteApiModel } from "../../../repo/siteApi.repo";
import { SiteMonitoringHistoryModel } from "../../../repo/siteHistory.repo";
import { DefaultResponse, InvalidInputError, ResourceNotFoundError } from "../../../typings/base.type";
import { getPaginationValues } from "../../../utils/base.utils";
import { logger } from "../../../utils/logger.utils";
import { GetMonitoringHisoryDto, GetOneMonthOverviewDto } from "./monitorV1History.dto";

class MonitorHistoryServiceClass {
  constructor(
    private readonly siteModel = SiteModel,
    private readonly siteApiModel = SiteApiModel,
    private readonly siteHistoryModel = SiteMonitoringHistoryModel,
  ) {}

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
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    if (startDate.getTime() > Date.now()) throw new InvalidInputError("Dates cannot be in the future");
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
    if(results.length == 0)
      throw new ResourceNotFoundError("No history found for the given API to provide the overview",true)
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
}

export const MonitorHistoryService = new MonitorHistoryServiceClass();
