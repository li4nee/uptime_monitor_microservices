import { AppDataSource } from "../dbconfig";
import { siteNotificationSetting } from "../entity/siteNotificationSetting.entity";

export const SiteNotificationSettingModel = AppDataSource.getRepository(siteNotificationSetting);
