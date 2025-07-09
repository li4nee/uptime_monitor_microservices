import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { HTTP_METHOD, NOTIFICATION_FREQUENCY, SITE_PRIORITY } from '../typings/base.type';
import { Site } from './site.entity';
import { GlobalEntity } from './global.entity';



@Entity()
export class SiteApi extends GlobalEntity{

  @ManyToOne(() => Site, site => site.id)
  @JoinColumn()
  site!: Site;

  @Index()
  @Column()
  path!: string;

  @Column({default:true})
  isActive!: boolean

  @Column({ enum: HTTP_METHOD, type: 'enum', default: HTTP_METHOD.GET })
  httpMethod!: HTTP_METHOD;

  @Column({ type: 'json', nullable: true })
  headers?: Record<string, string>;

  @Column({ type: 'json', nullable: true })
  body?: Record<string, any>;

  @Column({ default: 0 })
  consecutiveFailure!: number;

  @Column({ nullable: true })
  maxResponseTime!: number;

  @Column({default: 3})
  maxNumberOfAttempts!: number;


  @Column({ default: SITE_PRIORITY.MEDIUM, type: 'enum', enum: SITE_PRIORITY })
  priority!: SITE_PRIORITY;

  @Column({ default: true })
  notification!: boolean;

  @Column({ default: NOTIFICATION_FREQUENCY.ONCE, type: 'enum', enum: NOTIFICATION_FREQUENCY })
  notificationFrequency!: NOTIFICATION_FREQUENCY;

  @Column({ type: 'timestamp', nullable: true })
  lastNotificationSentAt?: Date;

}
