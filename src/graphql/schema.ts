import { makeExecutableSchema } from 'graphql-tools';
import * as userT from './typeDefs/user';
import * as userR from './resolvers/user';

const schema = makeExecutableSchema({
  typeDefs: [userT.typeDef],
  resolvers: [userR.resolvers]
});

export default schema;
