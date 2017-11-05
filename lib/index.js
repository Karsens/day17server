// @flow
/*
I'm at ssh leckr@178.79.186.237

don't forget, to update the server, do these commands:
1 = git add 
2 = git commit -m "hi"
3 = git push
---@server:
4 = pm2 stop 1
5 = git stash
6 = git pull
7 = yarn build
8 = yarn serve (or yarn dev if I want to test & see logs)
Simple as that!
*/

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
  latitude: { type: Sequelize.FLOAT },
  longitude: { type: Sequelize.FLOAT },
  city: { type: Sequelize.STRING },
  avatar: { type: Sequelize.STRING },
  done: { type: Sequelize.BOOLEAN },
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
  avatar: String
  done: Boolean
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
    avatar: String,
    done: Boolean,
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

/**
 * sends a pushnotification to the expo API.
 * Todo: add batching and multiple pushnotifications in an array
 */

const sendPush = (pushtoken: string, message: string): string => {
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
    .then(function(parsedBody): string {
      // POST succeeded...
      console.log(JSON.stringify(parsedBody));
      return `Success ${JSON.stringify(parsedBody)}`;
    })
    .catch(function(err): string {
      // POST failed...
      return `Post failed ${JSON.stringify(err)}`;
    });
};

/**
 * creates sub if it can't find one , returns amount of affected rows
 */
const createSubIfNew = async (
  Sub: sequelize.Model,
  pushtoken: string,
  channel: string
): Promise<0 | 1> => {
  const already = await Sub.findOne({ where: { pushtoken, channel } });

  // flow doesn't like this, though it seems to work!
  // maybe I do something wrong? Yeah... I told it would return a number but this function promises a number! HAH!
  // http://2ality.com/2016/10/async-function-tips.html
  if (already) {
    console.log("not creating subscriber. already exists");
    return 0;
  } else {
    console.log("creating subscriber:");
    return Sub.create({ pushtoken, channel });
  }
};

/**
 * Resolvers: The resolverMap object should have a map of resolvers for each relevant GraphQL Object Type
 */
const resolvers = {
  Query: {
    posts: (_, { channel }) =>
      Post.findAll({ where: { channel }, order: [["createdAt", "DESC"]] }),
    subs: (_, { pushtoken }) => Sub.findAll({ where: { pushtoken } })
  },
  Mutation: {
    /**
     * Creates post, 
     * Sends all subscribers push notifications
     */
    createPost: (
      _,
      {
        user,
        channel,
        text,
        pushtoken,
        phone,
        call,
        whatsapp,
        facebook,
        google,
        latitude,
        longitude,
        city,
        avatar,
        done,
        extra3
      }
    ) => {
      Sub.findAll({ where: { channel } }).then(subs => {
        let cumres: string = "";

        subs.forEach(sub => {
          if (sub.pushtoken && pushtoken !== sub.pushtoken) {
            const res = sendPush(sub.pushtoken, `${user} @${channel}: ${text}`);
            cumres.concat(res);
          }
        });

        console.log("Create-post for all subs send a push:", cumres);
      });

      createSubIfNew(Sub, pushtoken, channel);

      return Post.create({
        user,
        channel,
        text,
        likes: 0,
        pushtoken,
        phone,
        call,
        whatsapp,
        facebook,
        google,
        latitude,
        longitude,
        city,
        avatar,
        done: false,
        extra3
      });
    },

    /**
     * creates a subscriber
     */
    createSub: (_, { pushtoken, channel }) =>
      createSubIfNew(Sub, pushtoken, channel),
    likePost: (_, { id }) => {
      //send push notification
      Post.findOne({ where: { id } }).then(
        post =>
          post.pushtoken &&
          sendPush(post.pushtoken, `Someone liked your post in ${post.channel}`)
      );
      //x && y means if x then y and return result of y...
      //http://www.grauw.nl/blog/entry/510

      //add 1 to like column, and return affected rows
      return Post.update(
        { likes: sequelize.literal("likes + 1") },
        { where: { id } }
      )
        .then(res => res[0])
        .catch(e => 0);
    },
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

// I added request and request-promise to dependencies
// I created a HTTP/2 Request to the notification API using request-promise in order to return the result to return it in the graphql resolver

// I added flow so I had to
// 1. change the babel to --presets env,flow to compile.
// 2. yarn add -D babel-preset-flow
// 3. learn a lot about js and flow :-D
// It's possible to click on the flow in the bar below to see coverage

// Sometimes I need to resolve things multiple times, like sendPush and createSubIfNew. Then create a seperate function in the resolvers

//maybe choose something else than airbnb preset, but until now I can't care less.
