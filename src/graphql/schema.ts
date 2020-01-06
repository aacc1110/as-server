import { makeExecutableSchema, IResolvers } from 'graphql-tools';
import { gql } from 'apollo-server-koa';
import * as userT from './typeDefs/user';
import * as userR from './resolvers/user';
import * as postT from './typeDefs/post';
import * as postR from './resolvers/post';
import * as commentT from './typeDefs/comment';
import * as commentR from './resolvers/comment';
import DateScalar from './scalar/DateScalar';

const typeDef = gql`
  enum AlloweColor {
    RED
    GREEN
    BLUE
  }
  scalar Date
  scalar Email
  scalar JSON
  type Query {
    _version: String
  }
  type Mutation {
    _empty: String
  }
  type Subscription {
    _empty: String
  }
`;

const resolvers: IResolvers = {
  Date: DateScalar,
  Query: {
    _version: () => '0.1',
  },
  Mutation: {
    _empty: () => '',
  },
  Subscription: {
    _empty: () => '',
  },
};

const schema = makeExecutableSchema({
  typeDefs: [typeDef, userT.typeDef, postT.typeDef, commentT.typeDef],
  resolvers: [resolvers, userR.resolvers, postR.resolvers, commentR.resolvers],
});
/* addMockFunctionsToSchema({ schema }); */

export default schema;
