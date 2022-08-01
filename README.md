# flack

Flack is a clone of popular messaging app Slack built in two days. 
Using socket.io to broadcast messages to clients on the same network with no internet connection required.
Functionalities include creating channels, sending text messages within that channel and a bot that tells every user when a new channel is created. 
Channels are stored both in the DOM and Flask Server, so new users can see existing channels when they open the app for the first time. 
Flack does not allow you to send a message if you did not select a channel first and users cannot send empty messages
