import swaggerJSDoc from "swagger-jsdoc";
import { AddNewSiteApiDtoSwagger, EditExistingSiteApiSwagger, resgisterSiteMonitorSwagger } from "./modules/monitor_v1/site/monitorV1Site.swagger";

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
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
      schemas: {
        RegisterSiteMonitorDto: resgisterSiteMonitorSwagger,
        AddNewSiteApiDto: AddNewSiteApiDtoSwagger,
        EditExistingSiteApiDto: EditExistingSiteApiSwagger,
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
