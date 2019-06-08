import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
  BeforeInsert
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { UserProfile } from './UserProfile';
import { UserToken } from './UserToken';
import { Post } from './Post';

@Entity('users', { synchronize: true })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('varchar', { unique: true, length: 255 })
  email!: string;

  @Column('varchar', { nullable: true, length: 255 })
  name!: string;

  @Column('varchar', { length: 255 })
  password!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => UserProfile, userprofile => userprofile.user, {
    eager: true,
    cascade: true
  })
  userprofile!: UserProfile;

  @OneToOne(() => UserToken, usertoken => usertoken.user, {
    eager: true,
    cascade: true
  })
  usertoken!: UserToken;

  @OneToMany(() => Post, post => post.user, { cascade: true })
  posts!: Post[];

  @BeforeInsert()
  async hashedPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
