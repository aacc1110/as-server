import { makeExecutableSchema, IResolvers } from 'graphql-tools';
import { gql } from 'apollo-server-koa';
import * as userT from './typeDefs/user';
import * as userR from './resolvers/user';
import * as postT from './typeDefs/post';
import * as postR from './resolvers/post';
import DateScalar from './scalar/DateScalar';

const typeDef = gql`
  scalar Date
  scalar JSON
  type Query {
    _version: String
  }
  type Mutation {
    _empty: String
  }
`;

const resolvers: IResolvers = {
  Query: {
    _version: () => '0.1'
  },
  Mutation: {
    _empty: () => ''
  },
  Date: DateScalar
};

const schema = makeExecutableSchema({
  typeDefs: [typeDef, userT.typeDef, postT.typeDef],
  resolvers: [resolvers, userR.resolvers, postR.resolvers]
});
/* addMockFunctionsToSchema({ schema }); */

export default schema;
