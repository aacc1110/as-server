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
    readIt: Boolean
    liked: Boolean
    saved: Boolean
    comments: [Comment]
    commentsCount: Int
    series: Series
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
  type PostSave {
    id: ID!
    user: User
    post: Post
  }
  input PostInput {
    title: String!
    body: String!
    urlPath: String
    tags: [String]
    imageUrl: [String]
    seriesId: ID
  }

  extend type Query {
    post(id: ID, useremail: String, urlPath: String): Post
    posts(cursor: ID, take: Int): [Post]
    mainPosts(id: ID): [Post]
    trendPosts(offset: Int, limit: Int, timeframe: String): [Post]
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
