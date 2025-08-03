import { HTTP_METHOD, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../../typings/base.type";
export const resgisterSiteMonitorSwagger = {
  type: "object",
  required: ["url", "siteApis"],
  properties: {
    url: {
      type: "string",
      format: "uri",
      description: "The URL of the site to monitor",
      example: "https://example.com",
    },
    siteNotification: {
      type: "boolean",
      description: "Controls the entire site notification. If it's off, no notification will be sent for any of the APIs.",
      default: true,
    },
    siteApis: {
      type: "array",
      description: "List of APIs to monitor within the site",
      items: {
        type: "object",
        required: ["path", "httpMethod"],
        properties: {
          path: {
            type: "string",
            description: "API endpoint path (e.g., /health)",
            example: "/api/v1/health",
          },
          httpMethod: {
            type: "string",
            description: "HTTP method to use for the API",
            enum: Object.values(HTTP_METHOD),
          },
          headers: {
            type: "object",
            description: "Optional headers to include in the request",
            default: {},
            example: { Authorization: "Bearer token" },
          },
          body: {
            type: "object",
            description: "Optional request body",
            default: {},
          },
          maxResponseTime: {
            type: "number",
            description: "Max acceptable response time in ms",
            default: 5000,
          },
          maxNumberOfAttempts: {
            type: "number",
            description: "Max retry attempts before marking as down",
            default: 3,
          },
          priority: {
            type: "number",
            description: "Priority of the API",
            enum: Object.values(SITE_PRIORITY),
            default: SITE_PRIORITY.MEDIUM,
          },
          isActive: {
            type: "boolean",
            description: "Enable/disable monitoring for this API",
            default: true,
          },
          emailEnabled: {
            type: "boolean",
            description: "Enable email notifications for this API",
            default: false,
          },
          emailAddress: {
            type: "string",
            format: "email",
            description: "Email address for notifications",
            example: "user@example.com",
          },
          discordEnabled: {
            type: "boolean",
            description: "Enable Discord notifications for this API",
            default: false,
          },
          discordWebhook: {
            type: "string",
            description: "Discord webhook URL for notifications",
            example: "https://discord.com/api/webhooks/...",
          },
          slackEnabled: {
            type: "boolean",
            description: "Enable Slack notifications for this API",
            default: false,
          },
          slackWebhook: {
            type: "string",
            description: "Slack webhook URL for notifications",
            example: "https://hooks.slack.com/services/...",
          },
          notificationFrequency: {
            type: "string",
            description: "How often to send notifications",
            enum: Object.values(NOTIFICATION_FREQUENCY),
            default: NOTIFICATION_FREQUENCY.ONCE,
          },
        },
      },
    },
    siteName: {
      type: "string",
      description: "Optional name of the site",
      default: "",
      example: "My Example Site",
    },
    isActive: {
      type: "boolean",
      description: "Enable/disable monitoring for this site",
      default: true,
    },
  },
};


export const GetMonitoringRouteSwagger = {
  type: "object",
  properties: {
    siteId: {
      type: "string",
      description: "ID of the registered site",
      example: "60c72b2f9b1e8c001c8e4d3a",
    },
    siteApiId: {
      type: "string",
      description: "ID of the specific API within the site",
      example: "60c72b2f9b1e8c001c8e4d3b",
      required: false,
    },
    search: {
      type: "string",
      description: "Optional search term to filter APIs by path or URL or site name",
      example: "/health",
    },
    orderBy: {
      type: "enum",
      description: "Field to order the results by",
      enum: ["createdAt", "url"],
      example: "createdAt",
      default: "createdAt",
    },
    order: {
      type: "enum",
      description: "Order direction (asc or desc)",
      enum: ["ASC", "DESC"],
      example: "DESC",
      default: "DESC",
    },
    limit: {
      type: "number",
      description: "Number of results to return per page.Max value is 20 and min value is 1",
      example: 10,
      default: 10,
    },
    page: {
      type: "number",
      description: "Page number for pagination, starts from 0",
      example: 0,
      default: 0,
    },
    isActive: {
      type: "boolean",
      description: "Filter by active status of the site or API",
      example: true,
      default: true,
    },
    priority: {
      type: "number",
      description: "Filter by priority of the API",
      enum: [1, 2, 3, 4],
      example: 2,
      default: SITE_PRIORITY.MEDIUM,
    },
  },
};

export const GetMonitoringHistorySwagger = {
  type: "object",
  required: ["siteId", "siteApiId"],
  properties: {
    siteId: {
      type: "string",
      description: "ID of the registered site",
      example: "60c72b2f9b1e8c001c8e4d3a",
    },
    siteApiId: {
      type: "string",
      description: "ID of the specific API within the site",
      example: "60c72b2f9b1e8c001c8e4d3b",
    },
    monitoringHistoryId: {
      type: "string",
      description: "Optional ID of a specific monitoring history record",
      example: "60c72b2f9b1e8c001c8e4d3c",
    },
    status: {
      type: "string",
      description: "Filter by status (UP or DOWN)",
      enum: ["UP", "DOWN"],
      example: "UP",
    },
    startDate: {
      type: "string",
      format: "date-time",
      description: "Optional Start date for filtering history records",
      example: "2023-01-01T00:00:00Z",
    },
    endDate: {
      type: "string",
      format: "date-time",
      description: "Optional End date for filtering history records",
      example: "2023-01-31T23:59:59Z",
    },
    httpMethod: {
      type: "enum",
      description: "HTTP method used for the API request",
      enum: Object.values(HTTP_METHOD),
      example: "GET",
    },
    page: {
      type: "number",
      description: "Page number for pagination, starts from 1",
      defaultValue: 1,
      minimumValue: 1,
    },
    limit: {
      type: "number",
      description: "Number of results to return per page. Max value is 100 and min value is 1.",
      defaultValue: 10,
      minimumValue: 1,
      maximumValue: 100,
    },
    order: {
      type: "enum",
      description: "Order direction (asc or desc)",
      enum: ["ASC", "DESC"],
      defaultValue: "DESC",
    },
    orderBy: {
      type: "enum",
      description: "Field to order the results by",
      enum: ["checkedAt", "responseTime"],
      defaultValue: "checkedAt",
    },
  },
};

export const GetOneMonthOverviewSwagger = {
  type: "object",
  required: ["siteId", "siteApiId", "yearAndMonth"],
  properties: {
    siteId: {
      type: "string",
      description: "ID of the registered site to get the monthly overview",
      example: "60c72b2f9b1e8c001c8e4d3a",
    },
    siteApiId: {
      type: "string",
      description: "ID of the specific API within the site",
      example: "60c72b2f9b1e8c001c8e4d3b",
    },
    yearAndMonth: {
      type: "string",
      description: "Year and month in YYYY-MM format",
      example: "2023-01",
    },
    httpMethod: {
      type: "enum",
      description: "HTTP method used for the API request",
      enum: Object.values(HTTP_METHOD),
      example: "GET",
    },
  },
};

export const UpdateMonitoringRoutesSwagger = {
  type: "object",
  required: ["siteId"],
  properties: {
    siteId: {
      type: "string",
      description: "ID of the registered site to update",
      example: "60c72b2f9b1e8c001c8e4d3a",
    },
    siteApiId: {
      type: "string",
      description: "ID of the API route to update (if applicable)",
      example: "60c72b2f9b1e8c001c8e4d3b",
    },
    url: {
      type: "string",
      format: "uri",
      description: "New URL of the site (must be unique)",
      example: "https://example.com/api",
    },
    siteName: {
      type: "string",
      description: "Name of the site",
      example: "My Website",
    },
    siteNotification: {
      type: "boolean",
      description: "Enable or disable site-level notifications",
      example: true,
    },
    isActive: {
      type: "boolean",
      description: "Enable or disable monitoring for this site",
      example: true,
    },
    siteApis: {
      type: "array",
      description: "List of APIs to update or add under this site",
      items: {
        type: "object",
        properties: {
          siteApiId: {
            type: "string",
            description: "API ID (required if updating an existing API)",
            example: "60c72b2f9b1e8c001c8e4d3b",
          },
          path: {
            type: "string",
            description: "Path of the API",
            example: "/api/health",
          },
          httpMethod: {
            type: "string",
            enum: Object.values(HTTP_METHOD),
            description: "HTTP method used for the request",
            example: "GET",
          },
          headers: {
            type: "object",
            description: "Headers to include in the request",
            example: { Authorization: "Bearer token" },
          },
          body: {
            type: "object",
            description: "Request body (for POST/PUT)",
            example: { key: "value" },
          },
          maxResponseTime: {
            type: "number",
            description: "Maximum acceptable response time in ms",
            example: 2000,
          },
          maxNumberOfAttempts: {
            type: "number",
            description: "Number of retry attempts before marking as DOWN",
            example: 3,
          },
          priority: {
            type: "number",
            enum: [1, 2, 3, 4],
            description: "Priority level of the check",
            example: 2,
          },
          isActive: {
            type: "boolean",
            description: "Whether this API route is actively monitored",
            example: true,
          },
          emailEnabled: {
            type: "boolean",
            description: "Enable email alerts",
            example: true,
          },
          emailAddress: {
            type: "string",
            format: "email",
            description: "Email address to send alerts",
            example: "user@example.com",
          },
          discordEnabled: {
            type: "boolean",
            description: "Enable Discord alerts",
            example: false,
          },
          discordWebhook: {
            type: "string",
            description: "Discord webhook URL",
            example: "https://discord.com/api/webhooks/xyz",
          },
          slackEnabled: {
            type: "boolean",
            description: "Enable Slack alerts",
            example: true,
          },
          slackWebhook: {
            type: "string",
            description: "Slack webhook URL",
            example: "https://hooks.slack.com/services/xyz",
          },
          notificationFrequency: {
            type: "string",
            enum: Object.values(NOTIFICATION_FREQUENCY),
            description: "Notification frequency for alerts",
            example: "ONCE",
          },
        },
      },
    },
  },
};
