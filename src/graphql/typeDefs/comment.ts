import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type Comment {
    id: ID!
    comment: String!
    level: Int
    createdAt: Date
    like: Int
    hate: Int
    deleted: Boolean
    user: User
    post: Post
  }
`;
