import DataLoader from 'dataloader';
import { User } from '../../entity/User';
import { createQueryBuilder } from 'typeorm';
import { Post } from '../../entity/Post';
import { normalize } from '../utils';
import { Comment } from '../../entity/Comment';

export const createUserLoader = () =>
  new DataLoader<string, User>((ids: any) => {
    const users = User.findByIds(ids);
    return users;
  });

export const createCommentsLoader = () =>
  new DataLoader<string, Comment | never[]>(async postIds => {
    const posts = await createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.comments', 'comment')
      .whereInIds(postIds)
      .andWhere('comment.level = 0')
      .andWhere('comment.deleted = false or comment.hasReplies = true')
      .orderBy({
        'comment.createdAt': 'DESC',
      })
      .getMany();

    const normalized = normalize<Post>(posts);

    const commentsGroups = postIds.map(id => (normalized[id] ? normalized[id].comments : []));
    return commentsGroups;
  });
