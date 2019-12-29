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
  BeforeInsert,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { UserProfile } from './UserProfile';
import { UserToken } from './UserToken';
import { Post } from './Post';
import { Comment } from './Comment';

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

  @OneToOne(() => UserProfile, userProfile => userProfile.user, {
    eager: true,
    cascade: true,
  })
  userProfile!: UserProfile;

  @OneToOne(() => UserToken, userToken => userToken.user, {
    cascade: true,
  })
  userToken!: Promise<UserToken>;

  @OneToMany(() => Post, post => post.user, { cascade: true })
  posts!: Post[];

  @OneToMany(() => Comment, comment => comment.user, { cascade: true })
  comments!: Promise<Comment[]>;

  @BeforeInsert()
  async hashedPasswordInsert() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
