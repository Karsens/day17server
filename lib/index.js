// @flow

//////IMPORTS
import express from "express";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
const Sequelize = require("sequelize");
import { makeExecutableSchema } from "graphql-tools";
var rp = require("request-promise");

//////Connectors
const DEFAULT_CHANNEL = "Tarifa";

const sequelize = new Sequelize("", "", "", {
  host: "localhost",
  dialect: "sqlite",

  // SQLite only
  storage: "db.sqlite"
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

const Post = sequelize.define("post", {
  user: { type: Sequelize.STRING },
  channel: { type: Sequelize.STRING },
  text: { type: Sequelize.STRING },
  likes: { type: Sequelize.INTEGER },
  premium: { type: Sequelize.BOOLEAN },
  pushtoken: { type: Sequelize.STRING },
  phone: { type: Sequelize.STRING },
  whatsapp: { type: Sequelize.BOOLEAN },
  call: { type: Sequelize.BOOLEAN },
  facebook: { type: Sequelize.STRING }, //what about JSON?
  google: { type: Sequelize.STRING }, //what about JSON?
  latitude: { type: Sequelize.FLOAT }, //what about FLOAT?
  longitude: { type: Sequelize.FLOAT }, //what about FLOAT?
  city: { type: Sequelize.STRING },
  extra1: { type: Sequelize.STRING },
  extra2: { type: Sequelize.STRING },
  extra3: { type: Sequelize.STRING }
});

const Sub = sequelize.define("sub", {
  pushtoken: { type: Sequelize.INTEGER },
  channel: { type: Sequelize.STRING },
  subscribed: { type: Sequelize.BOOLEAN }
});

Post.sync({ force: true }).then(() => {
  // Table created
  return Post.create({
    user: "John",
    channel: DEFAULT_CHANNEL,
    text: "Test"
  });
});

Sub.sync({ force: true });

const sendPush = (pushtoken, message) => {
  var json = {
    to: pushtoken,
    title: "Notification",
    body: message
  };

  return rp({
    method: "POST",
    url: "https://exp.host/--/api/v2/push/send",
    body: json,
    json: true // Automatically stringifies the body to JSON
  })
    .then(function(parsedBody) {
      // POST succeeded...
      console.log(JSON.stringify(parsedBody));
      return `Success ${JSON.stringify(parsedBody)}`;
    })
    .catch(function(err) {
      // POST failed...
      return `Post failed ${JSON.stringify(err)}`;
    });
};

///////Schema

const typeDefs = `
type Sub {
  id: Int!

  pushtoken: String
  channel: String
  subscribed: Boolean 

  createdAt: String 
}

type Post {
  id: Int!

  user: String!
  channel: String!
  text: String!
  likes: Int
  premium: Boolean
  pushtoken: String
  phone: String
  whatsapp: Boolean
  call: Boolean
  facebook: String
  google: String
  latitude: Float
  longitude: Float
  city: String
  extra1: String
  extra2: String
  extra3: String

  createdAt: String
}

# the schema allows the following query:
type Query {
  posts(channel: String!): [Post]
  subs(pushtoken: String!): [Sub]
}

# this schema allows the following mutation:
type Mutation {
  createPost(
    user: String!,
    channel: String!,
    text: String!,
    premium: Boolean,
    pushtoken: String,
    phone: String,
    whatsapp: Boolean,
    call: Boolean,
    facebook: String,
    google: String,
    latitude: Float,
    longitude: Float,
    city: String,
    extra1: String,
    extra2: String,
    extra3: String      
  ): Post

  likePost(
    id: Int!
  ): Int

  createSub(
    pushtoken: String!, 
    channel: String!
  ): Sub

  deleteSub(
    pushtoken: String!, 
    channel: String!
  ): Int

  unSub(
    pushtoken: String!, 
    channel: String!
  ): Int

  sendPush(
    pushtoken: String!, 
    message: String!, 
  ): String

}
`;

///////Resolvers
//The resolverMap object should have a map of resolvers for each relevant GraphQL Object Type

const resolvers = {
  Query: {
    posts: (_, { channel }) => Post.findAll({ where: { channel } }),
    subs: (_, { pushtoken }) => Sub.findAll({ where: { pushtoken } })
  },
  Mutation: {
    createPost: (_, args) => Post.create(args),
    createSub: (_, { pushtoken, channel }) =>
      Sub.create({ pushtoken, channel }),
    likePost: (_, { id }) =>
      Post.update({ like: sequelize.literal("like + 1") }, { where: { id } })
        .then(res => res[0])
        .catch(e => 0),
    unSub: (_, { pushtoken, channel }) =>
      Sub.update({ subscribed: false }, { where: { pushtoken, channel } })
        .then(res => res[0])
        .catch(e => 0),
    deleteSub: (_, { pushtoken, channel }) =>
      Sub.destroy({ where: { pushtoken, channel } }),
    sendPush: (_, { pushtoken, message }) => sendPush(pushtoken, message)
  },

  Sub: {},
  Post: {}
};

///////Server execution

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const PORT = 3000;

var app = express();
app.use("/graphql", bodyParser.json(), graphqlExpress({ schema }));

app.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql"
  })
);

app.listen(PORT);

console.log(`Listening to ${PORT}`);
