import { AuthenticatedRequest } from "../../../typings/base.type";
import {
  AddMonitoringSiteDto,
  AddMonitoringSiteDtoSchema,
  AddNewSiteApiDto,
  AddNewSiteApiDtoSchema,
  EditExistingSiteApiDto,
  EditExistingSiteApiDtoSchema,
  GetMonitoringRoutesDto,
  GetMonitoringRoutesDtoSchema,
  UpdateMonitoringSiteDto,
  UpdateMonitoringSiteDtoSchema,
} from "./monitorV1Site.dto";

import { Response } from "express";
import { SiteService } from "./monitorV1Site.service";
class MonitorControllerClass {
  constructor(private readonly siteService = SiteService) {}

  async registerSiteMonitor(req: AuthenticatedRequest, res: Response) {
    let body: AddMonitoringSiteDto = await AddMonitoringSiteDtoSchema.validate(req.body);
    let result = await this.siteService.resisterRoutesApiToMonitor(body, req.userId);
    res.status(200).json(result);
    return;
  }

  async getSites(req: AuthenticatedRequest, res: Response) {
    let body: GetMonitoringRoutesDto = await GetMonitoringRoutesDtoSchema.validate(req.query);
    let result = await this.siteService.getMonitoringRoutes(body, req.userId);
    res.status(200).json(result);
    return;
  }

  async updateSite(req: AuthenticatedRequest, res: Response) {
    let body: UpdateMonitoringSiteDto = await UpdateMonitoringSiteDtoSchema.validate(req.body);
    let siteId = req.params.siteId;
    let result = await this.siteService.updateMonitoringSite(body, siteId, req.userId);
    res.status(200).json(result);
    return;
  }

  async deleteSite(req: AuthenticatedRequest, res: Response) {
    let siteId = req.params.siteId;
    let result = await this.siteService.deleteMonitoringSite(siteId, req.userId);
    res.status(200).json(result);
    return;
  }

  async editExistingSiteApi(req: AuthenticatedRequest, res: Response) {
    let body: EditExistingSiteApiDto = await EditExistingSiteApiDtoSchema.validate(req.body);
    let siteId = req.params.siteId;
    let siteApiId = req.params.siteApiId;
    let result = await this.siteService.editExistingSiteApi(body, siteId, siteApiId, req.userId);
    res.status(200).json(result);
    return;
  }

  async addSiteApi(req: AuthenticatedRequest, res: Response) {
    let body: AddNewSiteApiDto = await AddNewSiteApiDtoSchema.validate(req.body);
    let siteId = req.params.siteId;
    let result = await this.siteService.addSiteApi(body, siteId, req.userId);
    res.status(200).json(result);
    return;
  }

  async deleteSiteApi(req: AuthenticatedRequest, res: Response) {
    let siteId = req.params.siteId;
    let siteApiId = req.params.siteApiId;
    if (!siteId || !siteApiId) {
      res.status(400).json({ message: "Site ID and Site API ID are required" });
      return;
    }
    let result = await this.siteService.deleteSiteApi(siteId, siteApiId, req.userId);
    res.status(200).json(result);
    return;
  }
}

export const MonitorController = new MonitorControllerClass();
