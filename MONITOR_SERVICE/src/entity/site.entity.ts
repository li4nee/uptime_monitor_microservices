import { Column, Entity, Index, OneToMany } from "typeorm";
import { GlobalEntity } from "./global.entity";
import { SiteApi } from "./siteApi.entity";

/**
 * Represents a site being monitored.
 * @extends GlobalEntity
 * @property {string} url - The URL of the site.
 * @property {string} userId - The ID of the user who owns this site.
 * @property {boolean} notification - Whether notifications are enabled for this site.
 * If it's disabled no notification will be sent for any api endpoint of this site.It's like a global switch.
 * @property {SiteApi[]} siteApis - The APIs associated with this site.
 * @property {string} siteName - The name of the site.
 * @property {boolean} isActive - Indicates whether the site is currently active for monitoring.
 */

@Entity()
export class Site extends GlobalEntity {
  @Index()
  @Column()
  url!: string;

  @OneToMany(() => SiteApi, (siteApi) => siteApi.site, { cascade: true, nullable: true })
  siteApis!: SiteApi[] | undefined | null;

  @Column()
  userId!: string;

  @Column()
  siteName!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: true })
  notification!: boolean;
}
