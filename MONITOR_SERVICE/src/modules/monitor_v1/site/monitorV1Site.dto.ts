import * as yup from "yup";
import { HTTP_METHOD, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../../../typings/base.type";

export interface NotificationSettingDto {
  emailEnabled?: boolean;
  emailAddress?: string | null;
  discordEnabled?: boolean;
  discordWebhook?: string | null;
  slackEnabled?: boolean;
  slackWebhook?: string | null;
  notificationFrequency?: NOTIFICATION_FREQUENCY;
}

export interface SiteApiDto {
  path: string;
  httpMethod: HTTP_METHOD;
  headers?: Record<string, string>;
  body?: Record<string, any>;
  maxResponseTime?: number;
  maxNumberOfAttempts?: number;
  priority?: SITE_PRIORITY;
  isActive?: boolean;
  notificationSetting: NotificationSettingDto;
}

export interface OptionalSiteApiDto extends Partial<Omit<SiteApiDto, "notificationSetting">> {
  notificationSetting?: NotificationSettingDto;
}

export const notificationSettingSchema = yup.object({
  emailEnabled: yup.boolean().default(false),
  emailAddress: yup.string().email().nullable(),
  discordEnabled: yup.boolean().default(false),
  discordWebhook: yup.string().url().nullable(),
  slackEnabled: yup.boolean().default(false),
  slackWebhook: yup.string().url().nullable(),
  notificationFrequency: yup.string<NOTIFICATION_FREQUENCY>().oneOf(Object.values(NOTIFICATION_FREQUENCY)).default(NOTIFICATION_FREQUENCY.ONCE),
});

export const siteApiSchema = yup.object({
  path: yup.string().required(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).required(),
  headers: yup.object().default({}),
  body: yup.object().default({}),
  maxResponseTime: yup.number().default(5000),
  maxNumberOfAttempts: yup.number().default(3),
  priority: yup.number().oneOf([1, 2, 3, 4]).default(SITE_PRIORITY.MEDIUM),
  isActive: yup.boolean().default(true),
  notificationSetting: notificationSettingSchema.required(),
});

export const optionalSiteApiSchema = siteApiSchema.shape({
  path: yup.string().optional(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).optional(),
  notificationSetting: notificationSettingSchema.optional(),
});

export interface AddMonitoringSiteDto {
  url: string;
  siteNotification?: boolean;
  siteName?: string;
  isActive?: boolean;
  siteApis: SiteApiDto[];
}
export const AddMonitoringSiteDtoSchema = yup.object({
  url: yup.string().url().required(),
  siteNotification: yup.boolean().default(true),
  siteName: yup.string().default(""),
  isActive: yup.boolean().default(true),
  siteApis: yup.array().of(siteApiSchema).required(),
});

export interface UpdateMonitoringSiteDto {
  url?: string;
  siteNotification?: boolean;
  siteName?: string;
  isActive?: boolean;
}
export const UpdateMonitoringSiteDtoSchema = yup.object({
  url: yup.string().url().optional(),
  siteNotification: yup.boolean().optional(),
  siteName: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

export interface GetMonitoringRoutesDto {
  isActive?: boolean;
  priority?: SITE_PRIORITY;
  httpMethod?: HTTP_METHOD;
  siteNotification?: boolean;
  page: number;
  limit: number;
  order?: "ASC" | "DESC";
  orderBy?: "createdAt" | "url";
  search?: string;
  siteId?: string;
  siteApiId?: string;
}
export const GetMonitoringRoutesDtoSchema = yup.object({
  isActive: yup.boolean().optional(),
  priority: yup.number().oneOf([1, 2, 3, 4]).optional(),
  page: yup.number().default(0).min(0),
  limit: yup.number().default(10).min(1).max(20),
  order: yup.string().oneOf(["ASC", "DESC"]).default("DESC"),
  orderBy: yup.string().oneOf(["createdAt", "url"]).default("createdAt"),
  search: yup.string().optional(),
  siteId: yup.string().optional(),
  siteApiId: yup.string().optional(),
  httpMethod: yup.string().oneOf(Object.values(HTTP_METHOD)).optional(),
});

export interface EditExistingSiteApiDto extends OptionalSiteApiDto {}

export const EditExistingSiteApiDtoSchema = optionalSiteApiSchema.shape({});

export interface AddNewSiteApiDto {
  siteApis: SiteApiDto[];
}
export const AddNewSiteApiDtoSchema = yup.object({
  siteApis: yup.array().of(siteApiSchema).required(),
});
