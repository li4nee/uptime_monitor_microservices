import { Entity, Column, ManyToOne, Index } from "typeorm";
import { HTTP_METHOD } from "../typings/base.type";
import { GlobalEntity } from "./global.entity";
import { Site } from "./site.entity";
import { SiteApi } from "./siteApi.entity";

/**
 * Represents a history record of site monitoring checks.
 * @extends BaseEntity
 * @property {string} id - Unique identifier for the monitoring history record.
 * @property {('UP' | 'DOWN')} status - The status of the site during
 * the check, either 'UP' or 'DOWN'.
 * @property {number} statusCode - The HTTP status code returned during the check.
 * @property {Site} site - The site being monitored, linked to the Site entity.
 * @property {SiteApi} siteApi - The specific API endpoint being monitored, linked to the SiteApi entity.
 * @property {Date} checkedAt - The timestamp when the check was performed.
 * @property {string} errorLog - The error status message if the site was down.
 * @property {number} responseTime - The time taken to perform the check in milliseconds.
 * * @property {HTTP_METHOD} httpMethod - The HTTP method used for the check (GET, POST, etc.).
 * @property {Record<string, string>} headers - The HTTP headers sent with the request.
 * * Note: The `headers` and `body` properties are optional and can be null.
 * @property {Record<string, any>} body - The body of the request sent during the check.
 * * @property {number} attemptNumber - The number of attempts made to check the site.
 * @property {boolean} wasNotificationSent - Indicates if a notification was sent for this check
 * * @property {Object} notificationSentTo - Contains information about where notifications were sent,
 * such as email, Discord, or Slack.
 * * @property {string} notificationSentTo.email - Email address where the notification was sent
 * * @property {string} notificationSentTo.discord - Discord channel where the notification was sent
 * * @property {string} notificationSentTo.slack - Slack channel where the notification was
 */
@Entity()
export class SiteMonitoringHistory extends GlobalEntity {
  @Column()
  status!: "UP" | "DOWN";

  @Column()
  statusCode!: number;

  @ManyToOne(() => Site, (site) => site.id)
  site!: Site;

  @ManyToOne(() => SiteApi, (siteApi) => siteApi.id)
  siteApi!: SiteApi;

  @Column({ nullable: true })
  @Index()
  completeUrl!: string;

  @Column({ type: "float" })
  responseTime!: number;

  @Column({ nullable: true })
  errorLog!: string;

  @Column({ enum: HTTP_METHOD, type: "enum", default: HTTP_METHOD.GET })
  httpMethod!: HTTP_METHOD;

  @Column({ type: "json", nullable: true })
  headers?: Record<string, string>;

  @Column({ type: "json", nullable: true })
  body?: Record<string, any>;

  @Column()
  @Index()
  checkedAt!: Date;

  @Column({ default: 1 })
  attemptNumber!: number;

  @Column({ default: false })
  wasNotificationSent!: boolean;

  @Column({ type: "json", nullable: true })
  notificationSentTo?: { email?: string; discord?: string; slack?: string };
}
