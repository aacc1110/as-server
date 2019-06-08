import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type Post {
    id: ID!
    title: String!
    body: String!
    is_publish: Boolean
    meta: JSON
    views_count: Int
    short_summary: String
    url_path: String
    releasedAt: Date
    updatedAt: Date
    createdAt: Date

    user: User!
    tags: [Tag]!
    images: [Image]!
    comments: [Comment]!
  }
  type Tag {
    id: ID!
    tag: String!
    posts: [Post]!
  }
  type Image {
    id: ID!
    image_url: String!
    post: Post!
  }
  type Comment {
    id: ID!
    comment: String!
    level: Int
    post: Post!
  }

  extend type Query {
    post(id: ID!): Post!
    posts: [Post]!
    tag(tag: String): [Tag]
    tags: [Tag]!
  }

  extend type Mutation {
    postWrite(title: String!, body: String!, tags: [String], image_urls: [String]): Boolean!
    postUpdate(id: ID!, title: String!, body: String, tags: [String]): Boolean!
    postDelete(id: ID!): Boolean!
    commentWrite(postId: ID!, comment: String!, level: Int): Boolean!
  }
`;
