import swaggerJSDoc from "swagger-jsdoc";
import { resgisterSiteMonitorSwagger, UpdateMonitoringRoutesSwagger } from "./modules/monitor_v1/monitorV1.swagger";

const options = {
  definition: {
    openapi: "3.0.0", 
    info: {
      title: "Monitor Service API",
      version: "1.0.0",
      description: "API documentation for the Monitor Service",
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterSiteMonitorDto: resgisterSiteMonitorSwagger,
        UpdateSiteMonitorDto:UpdateMonitoringRoutesSwagger
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"]
};

export const swaggerSpec = swaggerJSDoc(options);
