import * as yup from "yup";
import { HTTP_METHOD, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../../typings/base.type";
export interface AddMonitoringRoutesDto {
  url: string;
  notification?: boolean;
  siteApis: {
    path: string;
    httpMethod: HTTP_METHOD;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    maxResponseTime?: number;
    maxNumberOfAttempts?: number;
    priority?: SITE_PRIORITY;
    notification?: boolean;
    notificationFrequency?: NOTIFICATION_FREQUENCY;
    isActive?: boolean;
  }[];
  siteName?: string;
  isActive?: boolean;
}

export const AddMonitoringRoutesDtoSchema = yup.object().shape({
  url: yup.string().url().required(),
  notification: yup.boolean().default(true),
  siteApis: yup
    .array()
    .of(
      yup.object().shape({
        path: yup.string().required(),
        httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).required(),
        headers: yup.object().default({}),
        body: yup.object().default({}),
        maxResponseTime: yup.number().default(5000),
        maxNumberOfAttempts: yup.number().default(3),
        priority: yup.number().oneOf([1, 2, 3, 4]).default(SITE_PRIORITY.MEDIUM),
        notification: yup.boolean().default(true),
        notificationFrequency: yup
          .string()
          .oneOf(Object.values(NOTIFICATION_FREQUENCY))
          .default(NOTIFICATION_FREQUENCY.ONCE),
        isActive: yup.boolean().default(true),
      }),
    )
    .required(),
  siteName: yup.string().default(""),
  isActive: yup.boolean().default(true),
});

export interface GetMonitoringRoutesDto {
  isActive?: boolean;
  priority?: SITE_PRIORITY;
  httpMethod?: HTTP_METHOD;
  notification?: boolean;
  page: number;
  limit: number;
  order?: "ASC" | "DESC";
  orderBy?: "createdAt" | "url";
  search?: string;
  siteId?: string;
  siteApiId?: string;
}

export const GetMonitoringRoutesDtoSchema = yup.object().shape({
  isActive: yup.boolean().default(true),
  priority: yup.number().oneOf([1, 2, 3, 4]).default(SITE_PRIORITY.MEDIUM),
  notification: yup.boolean().default(true),
  page: yup.number().default(0).min(0),
  limit: yup.number().default(10).min(1).max(20),
  order: yup.string().oneOf(["ASC", "DESC"]).default("DESC"),
  orderBy: yup.string().oneOf(["createdAt", "url"]).default("createdAt"),
  search: yup.string().optional(),
  siteId: yup.string().optional(),
  siteApiId: yup.string().optional(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).optional(),
});

export interface GetMonitoringHisoryDto {
  siteId: string;
  siteApiId: string;
  monitoringHistoryId?: string;
  status?: "UP" | "DOWN";
  startDate?: Date;
  endDate?: Date;
  httpMethod?: HTTP_METHOD;
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  orderBy?: "checkedAt" | "responseTime";
}

export const GetMonitoringHisoryDtoSchema = yup.object().shape({
  siteId: yup.string().required(),
  siteApiId: yup.string().required(),
  monitoringHistoryId: yup.string().optional(),
  status: yup.string().oneOf(["UP", "DOWN"]).optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).optional(),
  page: yup.number().default(1).min(1),
  limit: yup.number().default(10).min(1).max(100),
  order: yup.string().oneOf(["ASC", "DESC"]).default("DESC"),
  orderBy: yup.string().oneOf(["checkedAt", "responseTime"]).default("checkedAt"),
});

export interface GetOneMonthOverviewDto {
  siteId: string;
  siteApiId: string;
  yearAndMonth: string; // Format: YYYY-MM
  httpMethod?: HTTP_METHOD;
}

export const GetOneMonthOverviewDtoSchema = yup.object().shape({
  siteId: yup.string().required(),
  siteApiId: yup.string().required(),
  yearAndMonth: yup
    .string()
    .matches(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format")
    .required(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).optional(),
});
