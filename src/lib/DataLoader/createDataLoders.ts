import { createUserLoader, createCommentsLoader } from './dataLoader';

export default function createLoaders() {
  return {
    user: createUserLoader(),
    comments: createCommentsLoader(),
  };
}
export type Loaders = ReturnType<typeof createLoaders>;
