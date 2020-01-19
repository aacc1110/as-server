import DataLoader from 'dataloader';
import { User } from '../../entity/User';
import { createQueryBuilder } from 'typeorm';
import { Post } from '../../entity/Post';
import { normalize } from '../utils';
import { Comment } from '../../entity/Comment';

export const createUserLoader = () =>
  new DataLoader<string, User>(async userIds => {
    const users = await createQueryBuilder(User, 'user')
      .whereInIds(userIds)
      .getMany();

    const normalized = normalize(users, user => user.id);
    return userIds.map(id => normalized[id]);

    // return User.findByIds(ids);
  });

export const createCommentsLoader = () =>
  new DataLoader<string, Comment[]>(async postIds => {
    const posts = await createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.comments', 'comment')
      .whereInIds(postIds)
      .andWhere('comment.level = 0')
      .andWhere('comment.deleted = false')
      // .andWhere('comment.deleted = false or comment.hasReplies = true')
      .orderBy({
        'comment.createdAt': 'DESC',
      })
      .getMany();

    const normalized = normalize<Post>(posts);

    const commentsGroups = postIds.map(id => (normalized[id] ? normalized[id].comments : []));
    return commentsGroups;
  });

// export const createTagsLoader = () =>
//   new DataLoader<string, Tag[]>(async postIds => {
//     const postsTags = await createQueryBuilder('posts_tags')
//       .where('postsId IN (:...postIds)', { postIds })
//       .leftJoinAndSelect('posts_tags.tag', 'tag')
//       .orderBy('postsId', 'ASC')
//       .orderBy('tag.name', 'ASC')
//       .getMany();

//     return groupById<PostsTags>(postIds, postsTags, pt => pt.postId).map(array =>
//       array.map(pt => pt.tag),
//     );
//   });
