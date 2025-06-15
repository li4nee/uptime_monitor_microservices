import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn } from 'typeorm';

@Entity()
export class User extends BaseEntity{
  constructor()
  {
    super()
  }
  @PrimaryGeneratedColumn('uuid')
  id !: string;

  @CreateDateColumn()
  createdAt !: Date;

  @Column({ unique: true })
  email !: string;

  @Column()
  password !: string; 

  @Column({default: false})
  emailVerified!:boolean

  @Column({default:true})
  notification !:boolean

}
