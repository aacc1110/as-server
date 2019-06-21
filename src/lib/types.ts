import { loader } from './dataLoader';

export interface Context {
  loader: ReturnType<typeof loader>;
}
