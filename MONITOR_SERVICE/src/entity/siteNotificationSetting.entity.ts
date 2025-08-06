import { Column, Entity } from "typeorm";
import { GlobalEntity } from "./global.entity";
import { NOTIFICATION_FREQUENCY } from "../typings/base.type";

/**
 * Represents the notification settings for a site or API endpoint.
 * @extends GlobalEntity
 * @property {boolean} emailEnabled - Indicates if email notifications are enabled.
 * @property {string} emailAddress - The email address to send notifications to, if enabled.
 * @property {boolean} discordEnabled - Indicates if Discord notifications are enabled.
 * @property {string} discordWebhook - The Discord webhook URL to send notifications to, if enabled.
 * @property {boolean} slackEnabled - Indicates if Slack notifications are enabled.
 * @property {string} slackWebhook - The Slack webhook URL to send notifications to, if enabled.
 * @property {NOTIFICATION_FREQUENCY} notificationFrequency - The frequency of notifications (e.g., ONCE, DAILY).
 * @property {Date} lastNotificationSentAt - The timestamp of the last notification sent.
 */
@Entity()
export class siteNotificationSetting extends GlobalEntity {
  @Column({ default: false })
  emailEnabled!: boolean;

  @Column({ nullable: true })
  emailAddress?: string;

  @Column({ default: false })
  discordEnabled!: boolean;

  @Column({ nullable: true })
  discordWebhook?: string;

  @Column({ default: false })
  slackEnabled!: boolean;

  @Column({ nullable: true })
  slackWebhook?: string;

  @Column({ default: NOTIFICATION_FREQUENCY.ONCE, type: "enum", enum: NOTIFICATION_FREQUENCY })
  notificationFrequency!: NOTIFICATION_FREQUENCY;

  @Column({ type: "timestamp", nullable: true })
  lastNotificationSentAt?: Date | null;
}
