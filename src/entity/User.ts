import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { UserProfile } from './UserProfile';
import { UserToken } from './UserToken';
import { Post } from './Post';

@Entity('users', { synchronize: true })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('varchar', { length: 255 })
  email!: string;

  @Index()
  @Column('varchar', { length: 255, nullable: true })
  name!: string;

  @Column('varchar', { length: 255 })
  password!: string;

  @Column('boolean', { default: false })
  admin!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => UserProfile, userprofile => userprofile.user)
  @JoinColumn()
  userprofiles!: UserProfile;

  @OneToOne(() => UserToken, usertoken => usertoken.user)
  @JoinColumn()
  usertoken!: UserToken;

  @OneToMany(() => Post, post => post.user)
  posts!: Post[];
}
