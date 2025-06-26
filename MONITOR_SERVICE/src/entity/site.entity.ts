import {  Column,Entity, Index} from "typeorm";
import { NOTIFICATION_FREQUENCY, SITE_PRIORITY } from "../typings/base.type";
import { GlobalEntity } from "./global.entity";

/**
 * Represents a site being monitored.
 * @extends GlobalEntity
 * @property {string} url - The URL of the site.
 * @property {string} userId - The ID of the user who owns this site.
 * @property {boolean} notification - Whether notifications are enabled for this site.
 * @property {SITE_PRIORITY} priority - The priority level of the site.
 * @property {NOTIFICATION_FREQUENCY} notificationFrequency - Frequency of notifications for this site.
 * @property {Date} lastNotificationSentAt - Timestamp of the last notification sent for this site.
 */

@Entity()
export class Site extends GlobalEntity {
  @Index()
  @Column()
  url!: string;

  @Column()
  userId!: string;

  @Column({ default: true })
  notification!: boolean;

  @Column({ default: SITE_PRIORITY.MEDIUM, type: 'enum', enum: SITE_PRIORITY })
  priority!: SITE_PRIORITY;

  @Column({ default: NOTIFICATION_FREQUENCY.ONCE, type: 'enum', enum: NOTIFICATION_FREQUENCY })
  notificationFrequency!: NOTIFICATION_FREQUENCY;

  @Column({ type: 'timestamp', nullable: true })
  lastNotificationSentAt?: Date;
}
