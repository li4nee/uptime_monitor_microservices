import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class User extends BaseEntity{
  constructor()
  {
    super()
  }
  @PrimaryGeneratedColumn('uuid')
  id !: string;

  @Column({ unique: true })
  email !: string;

  @Column()
  password !: string; 

  @Column()
  emailVerified!:boolean

  @Column()
  notification !:boolean

}
