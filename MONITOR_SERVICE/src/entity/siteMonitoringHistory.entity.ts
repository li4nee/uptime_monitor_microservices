import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class SiteMonitoringHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  status!: 'UP' | 'DOWN';

  @Column()
  statusCode!: number;

  @Column()
  userId!: string;

  @Column()
  siteId!: string;

  @Column()
  checkedAt!: Date;
}
