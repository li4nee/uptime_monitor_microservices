import { HTTP_METHOD, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../../../typings/base.type";
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
            additionalProperties: { type: "string" },
            default: {},
            example: { Authorization: "Bearer token" },
          },
          body: {
            type: "object",
            description: "Optional request body",
            default: {},
            example: {},
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
          notificationSetting: {
            type: "object",
            properties: {
              emailEnabled: {
                type: "boolean",
                description: "Enable email notifications for this API",
                default: true,
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

export const AddNewSiteApiDtoSwagger = {
  type: "object",
  required: ["siteApis"],
  properties: {
    siteApis: {
      type: "array",
      description: "List of new APIs to add to the site",
      items: {
        type: "object",
        required: ["path", "httpMethod", "notificationSetting"],
        properties: {
          path: {
            type: "string",
            description: "API endpoint path",
            example: "/api/v1/health",
          },
          httpMethod: {
            type: "string",
            description: "HTTP method to use for the API",
            enum: Object.values(HTTP_METHOD),
            example: "GET",
          },
          headers: {
            type: "object",
            description: "Optional headers to include in the request",
            additionalProperties: { type: "string" },
            default: {},
            example: { Authorization: "Bearer token", "Content-Type": "application/json" },
          },
          body: {
            type: "object",
            description: "Optional request body",
            default: {},
            example: { query: "status", filter: "active" },
          },
          maxResponseTime: {
            type: "number",
            description: "Max acceptable response time in ms",
            default: 5000,
            example: 3000,
          },
          maxNumberOfAttempts: {
            type: "number",
            description: "Max retry attempts before marking as down",
            default: 3,
            example: 5,
          },
          priority: {
            type: "number",
            description: "Priority of the API",
            enum: Object.values(SITE_PRIORITY),
            default: SITE_PRIORITY.MEDIUM,
            example: SITE_PRIORITY.HIGH,
          },
          isActive: {
            type: "boolean",
            description: "Enable/disable monitoring for this API",
            default: true,
            example: true,
          },
          notificationSetting: {
            type: "object",
            required: [],
            properties: {
              emailEnabled: {
                type: "boolean",
                description: "Enable email notifications for this API",
                default: false,
                example: true,
              },
              emailAddress: {
                type: "string",
                format: "email",
                description: "Email address for notifications",
                example: "alerts@example.com",
                nullable: true,
              },
              discordEnabled: {
                type: "boolean",
                description: "Enable Discord notifications for this API",
                default: false,
                example: true,
              },
              discordWebhook: {
                type: "string",
                format: "url",
                description: "Discord webhook URL for notifications",
                example: "https://discord.com/api/webhooks/123456789/abcdefg",
                nullable: true,
              },
              slackEnabled: {
                type: "boolean",
                description: "Enable Slack notifications for this API",
                default: false,
                example: true,
              },
              slackWebhook: {
                type: "string",
                format: "url",
                description: "Slack webhook URL for notifications",
                example: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
                nullable: true,
              },
              notificationFrequency: {
                type: "string",
                description: "How often to send notifications",
                enum: Object.values(NOTIFICATION_FREQUENCY),
                default: NOTIFICATION_FREQUENCY.DAILY,
                example: NOTIFICATION_FREQUENCY.HOURLY,
              },
            },
          },
        },
      },
    },
  },
};

export const EditExistingSiteApiSwagger = {
  type: "object",
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
    notificationSetting: {
      type: "object",
      properties: {
        emailEnabled: {
          type: "boolean",
          description: "Enable email notifications for this API",
          default: false,
        },
        emailAddress: {
          type: "string",
          format: "email",
          description: "Email address for notifications",
          example: "",
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
};
