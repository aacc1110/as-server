import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    password: String
    profile: UserProfile
  }
  type UserProfile {
    id: ID!
    thumbnail: String
    about: String
  }
  type Query {
    me: User
  }
  type Mutation {
    register(email: String!, name: String!, password: String!): Boolean!
    login(email: String!, password: String!): User
    logout: Boolean!
  }
`;
