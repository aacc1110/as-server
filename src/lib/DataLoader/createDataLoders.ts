import {
  createUserLoader,
  createCommentsLoader,
  createSeriesListLoader,
  createSeriesPostsLoader,
} from './dataLoader';

export default function createLoaders() {
  return {
    user: createUserLoader(),
    comments: createCommentsLoader(),
    seiresList: createSeriesListLoader(),
    seriesPosts: createSeriesPostsLoader(),
  };
}
export type Loaders = ReturnType<typeof createLoaders>;
