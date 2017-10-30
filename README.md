
CHALLENGE 0 - Project definition:

Server: 8 queries instead of 2. How long will it take?

PUBLIC: accessible for anyone, even without app
- posts($channel) { id, likes, user, channel, text, createdAt, premium, pushtoken, phone, whatsapp, call, facebook, google, latitude, longitude, city, extra1, extra2, extra3 } //dont return pushtoken! it's secret!
- createPost(...) //use some validation in resolver
- likePost($id) { }
PUBLIC but using a secret token: accessible for anyone, but you need special token
- subscriptions($pushtoken) { id, pushtoken, channel, createdAt, subscribed } //my channels page, order by createdAt, subscribed
- sendPush($pushtoken, $message, ?$settings){ ... } // push a notification with $message to $token, possibly with $settings. < can be accessible because token is secret anyway
- createSub($pushtoken, $channel) // fire this the first time a user posts in a channel
- deleteSub($pushtoken, $channel) // use secret pushtoken and channel
- unSub($pushtoken, $channel) //update subsribed=false

ONLY SERVER CAN ACCESS:
- allSubscriptions($channel) { ... } // server side, so just resolver to find all tokens to push to and push. 

Client:
- Posts Tab with posts (card-component & post query), and create post input (input component). User object gets sent to server with every post (post mutation)
- Settings Tab for representation of device-object
  - What I have now
  - Represent FB + Google data
  - Clear FB + Google data buttons
  - Represent location data with city
  - Remove the channel representation. This will get its own tab

- Explore tab with channel picker of common channels and all subscribed channels
- Premium tab: subscribe to more than 3 channels & show that you're premium. Include most simple payment option of expo or react native
- Deliver notifications to all subscriptions
- Listen to location & push token & permissions

It seems to be a save server, because I kind of create the secret pushtoken as a secret device id, so those queries are only accessible for the person that knows this ID. 
# day17server
