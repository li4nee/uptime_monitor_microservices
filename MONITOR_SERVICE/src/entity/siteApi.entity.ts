import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { HTTP_METHOD, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../typings/base.type";
import { Site } from "./site.entity";
import { GlobalEntity } from "./global.entity";
import { siteNotificationSetting } from "./siteNotificationSetting.entity";

/**
 * Represents an API endpoint for a site that is being monitored.
 * @extends GlobalEntity
 * @property {Site} site - The site to which this API endpoint belongs, linked to the Site entity.
 * @property {string} path - The specific path of the API endpoint.
 * @property {boolean} isActive - Indicates whether this API endpoint is currently active for monitoring.
 * @property {HTTP_METHOD} httpMethod - The HTTP method used for requests to this API
 * endpoint (GET, POST, etc.).
 * @property {Record<string, string>} headers - The HTTP headers to be sent with requests
 * to this API endpoint.
 * * Note: The `headers` and `body` properties are optional and can be null
 *  * @property {Record<string, any>} body - The body of the request to be sent to this API endpoint.
 * @property {number} maxResponseTime - The maximum acceptable response time for this API endpoint
 * in milliseconds.
 * @property {number} maxNumberOfAttempts - The maximum number of attempts to check this API endpoint
 * before considering it down.
 * @property {SITE_PRIORITY} priority - The priority level of this API endpoint for monitoring.
 * @property {siteNotificationSetting} notificationSetting - The notification settings for this API endpoint,
 * which includes how and when notifications should be sent if the endpoint is down.
 */
@Entity()
export class SiteApi extends GlobalEntity {
  @ManyToOne(() => Site, (site) => site.id)
  @JoinColumn()
  site!: Site;

  @Index()
  @Column()
  path!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ enum: HTTP_METHOD, type: "enum", default: HTTP_METHOD.GET })
  httpMethod!: HTTP_METHOD;

  @Column({ type: "json", nullable: true })
  headers?: Record<string, string>;

  @Column({ type: "json", nullable: true })
  body?: Record<string, any>;

  @Column({ nullable: true, type: "float" })
  maxResponseTime!: number;

  @Column({ default: 3 })
  maxNumberOfAttempts!: number;

  @Column({ default: SITE_PRIORITY.MEDIUM, type: "enum", enum: SITE_PRIORITY })
  priority!: SITE_PRIORITY;

  @ManyToOne(() => siteNotificationSetting, { cascade: true })
  @JoinColumn()
  notificationSetting!: siteNotificationSetting;
}
