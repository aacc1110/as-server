import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type User {
    id: ID!
    email: String!
    name: String
    password: String
    userprofile: UserProfile
    usertoken: UserToken!
    posts: [Post!]
  }
  type UserProfile {
    id: ID!
    about: String
    thumbnail: String
    mobile: String
  }
  type UserToken {
    id: ID!
    token_id: String
    faulty: Boolean
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
    users: [User!]!
  }
  extend type Mutation {
    createMe(user: UserInput!, userprofile: UserProfileInput): Boolean!
    updateMe(user: UserInput!, userprofile: UserProfileInput): Boolean!
    deleteMe(id: ID!): Boolean!
    login(email: String!, password: String!): LoginResponse!
    logout: Boolean
  }
  type LoginResponse {
    accessToken: String
    user: User!
  }
`;
