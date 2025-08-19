import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Index } from "typeorm";
import { Site } from "./site.entity";
import { SiteApi } from "./siteApi.entity";
import { GlobalEntity } from "./global.entity";

@Entity()
export class SiteSLAReport extends GlobalEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Site)
  site!: Site;

  @Column()
  @Index()
  periodStart!: Date;

  @Column()
  @Index()
  periodEnd!: Date;

  @Column({ default: 0 })
  totalChecks!: number;

  @Column({ default: 0 })
  upChecks!: number;

  @Column({ default: 0 })
  downChecks!: number;

  @Column({ type: "float", nullable: true })
  uptimePercentage?: number;

  @Column({ type: "float", nullable: true })
  averageResponseTime?: number;

  @Column({ type: "float", nullable: true })
  maxResponseTime?: number;

  @Column({ type: "float", nullable: true })
  minResponseTime?: number;

  @Column({ default: 0 })
  slowResponseCount!: number;
}
