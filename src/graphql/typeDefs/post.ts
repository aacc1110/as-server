import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type Post {
    id: ID!
    title: String!
    body: String!
    isPublish: Boolean
    meta: JSON
    viewsCount: Int
    shortSummary: String
    urlPath: String
    releasedAt: Date
    updatedAt: Date
    createdAt: Date

    user: User
    tags: [Tag]
    images: [Image]
    comments: [Comment]
  }
  type Tag {
    id: ID!
    tag: String!
    posts: [Post]!
  }
  type Image {
    id: ID!
    imageUrl: String!
    post: Post!
  }

  input PostInput {
    title: String!
    body: String!
    urlPath: String
    tags: [String]
    imageUrl: [String]
  }

  extend type Query {
    post(id: ID, userEmail: String, urlPath: String): Post
    posts(cursor: ID, take: Int): [Post]
    tag(tag: String): [Tag]
    tags: [Tag]
    comment(id: ID): Comment
    comments(postId: ID): [Comment]
  }

  extend type Mutation {
    writePost(postInput: PostInput): Boolean!
    updatePost(id: ID!, postInput: PostInput): Boolean!
    deletePost(id: ID!): Boolean!
    writeComment(postId: ID!, comment: String!, level: Int): Boolean!
  }
`;
