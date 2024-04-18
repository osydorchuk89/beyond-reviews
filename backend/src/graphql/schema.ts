import { buildSchema } from "graphql";

export const schema = buildSchema(`
    type User {
    _id: ID
    firstName: String
    lastName: String
    email: String
    password: String
    googleId: String
    }

    type Message {
        _id: ID
        sender: User
        recipient: User
        message: String
        date: String
    }

  input messageData {
    sender: String
    recipient: String
    message: String
    date: String
  }  

  type Query {
    getMessage: String
  }
  
  type Mutation {
    sendMessage(messageData: messageData): Message
  }
`);
