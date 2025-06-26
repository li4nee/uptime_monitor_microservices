import { AppDataSource } from "../dbconfig";
import { SiteApi } from "../entity/siteApi.entity";

export const SiteApiModel = AppDataSource.getRepository(SiteApi)