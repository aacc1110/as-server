import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type Post {
    id: ID!
    title: String!
    body: String!
    likes: Int
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
    liked: Boolean
    readIt: Boolean
    saved: Boolean
    comments: [Comment]
    commentsCount: Int
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
  }

  extend type Mutation {
    writePost(postInput: PostInput): Boolean!
    updatePost(id: ID!, postInput: PostInput): Boolean!
    deletePost(id: ID!): Boolean!
    likePost(id: ID!): Post
    unlikePost(id: ID!): Post
    postRead(id: ID!): Boolean
    postSave(id: ID!): Boolean
  }
`;
