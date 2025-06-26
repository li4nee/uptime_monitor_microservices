import { AppDataSource } from "../dbconfig";
import { Site } from "../entity/site.entity";

export const SiteModel = AppDataSource.getRepository(Site)