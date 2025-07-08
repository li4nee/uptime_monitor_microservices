import {  Column,Entity, Index, OneToMany} from "typeorm";
import { GlobalEntity } from "./global.entity";
import { SiteApi } from "./siteApi.entity";

/**
 * Represents a site being monitored.
 * @extends GlobalEntity
 * @property {string} url - The URL of the site.
 * @property {string} userId - The ID of the user who owns this site.
 * @property {boolean} notification - Whether notifications are enabled for this site.
 * @property {SiteApi[]} siteApis - The APIs associated with this site.
 */

@Entity()
export class Site extends GlobalEntity {
  @Index()
  @Column()
  url!: string;

  @OneToMany(() => SiteApi, siteApi => siteApi.site)
  siteApis!: SiteApi[];

  @Column()
  userId!: string;

  @Column({ default: true })
  notification!: boolean;

}
