import { makeExecutableSchema } from 'graphql-tools';
import * as user from './user';

const schema = makeExecutableSchema({
  typeDefs: [user.typeDef],
  resolvers: [user.resolvers]
});

export default schema;
