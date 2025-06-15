import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn } from 'typeorm';
import { NOTIFICATION_FREQUENCY, SITE_PRIORITY } from '../typings/base.type';

@Entity()
export class Site extends BaseEntity{
    constructor()
    {
        super()
    }

    @PrimaryGeneratedColumn('uuid')
    id !: string;

    @CreateDateColumn()
    createdAt !: Date;

    @Column()
    url !: string;

    @Column({ default: true })
    notification !: boolean;

    @Column()
    userId!: string;

    @Column({default: 0})
    consecutiveFailure!: number;

    @Column({default:SITE_PRIORITY.MEDIUM,type:"enum", enum: SITE_PRIORITY})
    priority!: SITE_PRIORITY

    @Column({default:NOTIFICATION_FREQUENCY.ONCE, type:"enum", enum: NOTIFICATION_FREQUENCY})
    notificationFrequency!: NOTIFICATION_FREQUENCY;
    
    @Column({ type: 'timestamp', nullable: true })
    lastNotificationSentAt!: Date;

}
