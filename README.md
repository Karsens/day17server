
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


44: Proud 

Tuesday morning 5:00 - 7:30 ——> setup app boilerplate & make plan for screens on functions in component level.

Tuesday afternoon 13:00 - 20:00 ———> create whole app, try to fix as many problems as possible of the todo list here

Wednesday 5:00 - 10:00 work, then buy kite & fix chicken loop, then work again or kitesurf !!!
Thursday-Sunday: depends on the wind, but try to fix these 10 new things!

1. notifications working & testing 
	just the 3 steps I already know, see document ~1 hour

2. redux persist user object
	look at twitter boilerplate, test, if it doesn’t work, then look at chatty boilerplate. If that doesn’t work, then go to documentation. 
	Then try using the redux store instead of the aSyncstorage directly. ~2 hours max per attempt!

3. Variables in queries
	look at twitter clone tutorial again, but try to find it in GitHub docs!

4. FB & Google data use
	a) Explore the apis 
	b) Think about things I could do with it
	c) Make a nice profile picture from google login 
5. typing everything (flow): just keep this in mind all the time!

6. location representation
	Create function that calculates distance between two coords
	Create function that calculates city from coords (look back at Communify thingy… I had something)

7. much more data to view in UI… 
	Play with background colours of cards to represent proudness-level
	Add onPress handler that changes color
	Add smart ordering function (yes, I have to go back to the server sometimes probably)

8. test functionality on real devices with roommates, 
	
9. go through iTunes connect and Google Play Console.

10. build more complex screens

If I don’t succeed with proud, then try magic and kitetik in the weeks after and delay the rest!
