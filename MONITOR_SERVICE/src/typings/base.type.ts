import { Request } from "express";

export enum SITE_PRIORITY {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export enum NOTIFICATION_FREQUENCY {
  ONCE = "ONCE", // Only first time it goes down
  EVERY = "EVERY", // Every time it's checked and still down
  HOURLY = "HOURLY", // At most once every hour
  DAILY = "DAILY", // At most once per day
  NONE = "NONE", // Don't send notifications
}

export enum HTTP_METHOD {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

export interface SiteMonitorDTO {
  siteId: string;
  siteApiId: string;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  httpMethod: HTTP_METHOD;
  maxResponseTime?: number;
  priority: SITE_PRIORITY;
  userId: string;
  siteNotification?: boolean;
  maxNumberOfAttempts: number;
  completeUrl: string;
  notification?: {
    emailEnabled?: boolean;
    emailAddress?: string;
    discordEnabled?: boolean;
    discordWebhook?: string;
    slackEnabled?: boolean;
    slackWebhook?: string;
    notificationFrequency?: NOTIFICATION_FREQUENCY;
    lastSentNotificationAt?: Date | null;
  };
}

export class CustomError {
  statusCode: number;
  message: string | null;
  logged: boolean;
  constructor(message: string, statusCode: number, logged: boolean = false) {
    this.statusCode = statusCode;
    this.message = message;
    this.logged = logged;
  }
}

export class InvalidInputError extends CustomError {
  constructor(message: string = "Invalid input", logged: boolean = false) {
    super(message, 400, logged);
  }
}

export class PermissionNotGranted extends CustomError {
  constructor(messag: string = "Permission not granted", logged: boolean = false) {
    super(messag, 403, logged);
  }
}

export class ResourceNotFoundError extends CustomError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}

export enum ROLE {
  ADMIN = "admin",
  USER = "user",
}
export interface AuthenticatedRequest extends Request {
  userId: string;
  role?: ROLE;
}

export class DefaultResponse {
  status: number;
  message: string;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

export interface MailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface slackOptions {
  channel: string;
  text: string;
}

export interface discordOptions {
  channelId: string;
  content: string;
}

export interface NotificationData {
  emailEnabled?: boolean;
  emailAddress?: string;
  discordEnabled?: boolean;
  discordWebhook?: string;
  slackEnabled?: boolean;
  slackWebhook?: string;
}
