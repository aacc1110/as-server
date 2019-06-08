import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type User {
    id: ID!
    email: String!
    name: String
    password: String
    userprofile: UserProfile!
    posts: [Post!]
  }
  type UserProfile {
    id: ID!
    thumbnail: String
    about: String
    mobile: String
  }
  input UserInput {
    email: String
    name: String
    password: String
  }
  input UserProfileInput {
    thumbnail: String
    about: String
    mobile: String
  }

  extend type Query {
    me: User
    user(id: ID!): User!
  }
  extend type Mutation {
    createMe(user: UserInput!, userprofile: UserProfileInput): Boolean!
    updateMe(name: String!, userprofile: UserProfileInput): Boolean!
    deleteMe(id: ID!): Boolean!
    login(email: String!, password: String!): User!
    logout: Boolean!
  }
`;
