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
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { UserProfile } from './UserProfile';
import { UserToken } from './UserToken';
import { Post } from './Post';
import { Comment } from './Comment';
import { PostLike } from './PostLike';
import { PostScore } from './PostScore';
import { PostSave } from './PostSave';
import { PostRead } from './PostRead';

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
  userToken!: UserToken;

  @OneToMany(() => Post, post => post.user, { cascade: true })
  posts!: Post[];

  @OneToMany(() => Comment, comments => comments.user, { cascade: true })
  comments!: Comment[];

  @OneToMany(() => PostLike, postlike => postlike.user, { cascade: true })
  postlike!: PostLike[];

  @OneToMany(() => PostRead, postread => postread.user, { cascade: true })
  postread!: PostRead[];

  @OneToMany(() => PostScore, postscore => postscore.user, { cascade: true })
  postscore!: PostScore[];

  @OneToMany(() => PostSave, postsave => postsave.user, { cascade: true })
  postsave!: PostSave[];

  @BeforeInsert()
  async hashedPasswordInsert() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
