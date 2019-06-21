import DataLoader from 'dataloader';
import { User } from '../entity/User';
import { Tag } from '../entity/Tag';

type BatchFn = (ids: string[]) => Promise<User[]>;

// [1, 2, ...]
// users = [{id: 2, name: 'tadrow'}, {id: 1, name: 'aacc'}]

const batchFn: BatchFn = async ids => {
  console.log('ids', ids);
  const users = await User.findByIds(ids);

  console.log('users', [users]);

  const userMap: { [key: string]: User } = {};
  console.log('userMap', userMap);
  users.forEach(u => {
    userMap[u.id] = u;
  });

  return ids.map(id => userMap[id]);
};
export const loader = () => new DataLoader<string, User>(batchFn);

export const tagLoader = () =>
  new DataLoader(async ids => {
    const tagList = await Tag.findByIds(ids);
    console.log('tagList', tagList);
    return ids.map(id => tagList.find((tag: any) => tag.id === id));
  });
