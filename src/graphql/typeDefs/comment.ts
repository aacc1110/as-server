import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type Comment {
    id: ID!
    text: String!
    level: Int
    like: Int
    hate: Int
    hasReplies: Boolean
    deleted: Boolean
    createdAt: Date
    replies: [Comment]
    repliesCount: Int
    user: User
  }
  extend type Query {
    comment(id: ID): Comment
    subcomments(id: ID): [Comment]
  }
  extend type Mutation {
    writeComment(id: ID, postId: ID!, text: String!): Boolean!
    editComment(id: ID!, text: String!): Boolean
    removeComment(id: ID!, postId: ID): Boolean
  }
`;
