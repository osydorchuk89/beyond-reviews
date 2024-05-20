"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
exports.schema = (0, graphql_1.buildSchema)(`
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
