import { gql } from 'apollo-server-koa';

// # 필드 이름 은을 사용해야 camelCase합니다. 많은 GraphQL 클라이언트는 JavaScript, Java, Kotlin 또는 Swift로 작성되며 모두 camelCase변수 이름에 권장 됩니다.
// # 유형 이름 은을 사용해야 PascalCase합니다. 이것은 위에서 언급 한 언어로 클래스를 정의하는 방법과 일치합니다.
// # 열거 형 이름 은을 사용해야 PascalCase합니다.
// # 열거 형 값 은 ALL_CAPS상수와 유사하므로를 사용해야합니다 .

export const typeDef = gql`
  type User {
    id: ID!
    email: String!
    name: String
    password: String
    userProfile: UserProfile
    userToken: UserToken!
    posts: [Post!]
    postSave: [PostSave]
    seriesList: [Series]
  }
  type PostSave {
    id: ID!
    user: User
    post: Post
  }
  type UserProfile {
    id: ID!
    about: String
    thumbnail: String
    imageUrl: String
    mobile: String
  }
  type UserToken {
    id: ID!
    tokenId: String
    faulty: Boolean
  }
  type UserEmailConfirm {
    email: String
    code: String
    confirm: Boolean
    createdAt: Date
  }
  type LoginResponse {
    accessToken: String
    refreshToken: String
    tokenId: String!
    user: User!
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
    me: User!
    user(email: String!): User
    users: [User!]!
    userEmailConfirm(code: String!): UserEmailConfirm
  }
  extend type Mutation {
    checkUser(email: String!): Boolean!
    sendEmail(email: String!): Boolean!
    login(email: String!, password: String!): LoginResponse
    logout: Boolean
    createMe(userInput: UserInput!, userProfileInput: UserProfileInput): Boolean!
    updateMe(userInput: UserInput!, userProfileInput: UserProfileInput): Boolean!
    deleteMe(id: ID!): Boolean!
  }
  extend type Subscription {
    addUser(id: ID, email: String): User
  }
`;
