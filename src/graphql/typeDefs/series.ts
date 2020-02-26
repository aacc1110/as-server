import { gql } from 'apollo-server-koa';

export const typeDef = gql`
  type Series {
    id: ID!
    user: User
    name: String
    description: String
    urlPath: String
    createdAt: Date
    updatedAt: Date
    seriesPosts: [SeriesPosts]
    thumbnail: String
    postsCount: Int
  }
  type SeriesPosts {
    id: ID!
    index: Int
    post: Post
  }
  extend type Query {
    series(id: ID, useremail: String, urlPath: String): Series
    seriesList(useremail: String): [Series]
  }
  extend type Mutation {
    createSeries(name: String!, urlPath: String!): Series
    appendToSeries(seriesId: ID!, postId: ID!): Int
    editSeries(id: ID!, name: String!, seriesOrder: [ID]): Series
    removeSeries(id: ID!): Boolean
  }
`;

export interface CreateSeriesArgs {
  name: string;
  urlPath: string;
}

type AppendToSeriesArgs = {
  postId: string;
  seriesId: string;
};
