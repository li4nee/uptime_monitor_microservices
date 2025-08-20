import * as yup from "yup";
import { HTTP_METHOD } from "../../../typings/base.type";
export interface GetMonitoringHisoryDto {
  siteId?: string;
  siteApiId?: string;
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
  siteId: yup.string().optional(),
  siteApiId: yup.string().optional(),
  monitoringHistoryId: yup.string().optional(),
  status: yup.string().oneOf(["UP", "DOWN"]).optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).optional(),
  page: yup.number().default(0).min(0),
  limit: yup.number().default(10).min(1).max(20),
  order: yup.string().oneOf(["ASC", "DESC"]).default("DESC"),
  orderBy: yup.string().oneOf(["checkedAt", "responseTime"]).default("checkedAt"),
});

export interface GetOneMonthOverviewDto {
  siteId: string;
  siteApiId: string;
  yearAndMonth: string; // Format: YYYY-MM
  // httpMethod?: HTTP_METHOD;
}

export const GetOneMonthOverviewDtoSchema = yup.object().shape({
  siteId: yup.string().required(),
  siteApiId: yup.string().required(),
  yearAndMonth: yup
    .string()
    .matches(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format")
    .required(),
});

export interface GetSLAReportHistoryDto {
  reportId?: string;
  siteId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  orderBy?: "createdAt" | "totalChecks" | "upChecks" | "downChecks" | "uptimePercentage";
}

export const GetSLAReportHistoryDtoSchema = yup.object().shape({
  reportId: yup.string().optional(),
  siteId: yup.string().optional(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
  page: yup.number().default(0).min(0),
  limit: yup.number().default(10).min(1).max(20),
  order: yup.string().oneOf(["ASC", "DESC"]).default("DESC"),
  orderBy: yup.string().oneOf(["createdAt", "totalChecks", "upChecks", "downChecks", "uptimePercentage"]).default("createdAt"),
});
