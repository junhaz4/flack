import os

from flask import Flask, render_template, jsonify, session, request
from flask_session import Session
from flask_socketio import SocketIO, emit
from collections import defaultdict

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# List to store usernames, channels and messages
names = []
channels = []
# Storing messages as a dictionary with key = value of channel name
messages = defaultdict(list)


@socketio.on("send text")
def sendToEveryone(data):
    text = str(data["text"])
    date = str(data["date"])
    name = str(data["name"])
    complete_text = {'username': session["username"], 'content': text, 'date': date}
    # Emit the new message to everyone
    socketio.emit("new message", {"message": complete_text, "name": name}, include_self=False)


@app.route("/text", methods=["POST"])
def text():
    text = str(request.form.get("text"))
    date = str(request.form.get("date"))
    index = int(request.form.get("id"))
    name = str(request.form.get("name"))
    complete_text = {'username': session["username"], 'content': text, 'date': date}
    # Add text to the list of messages in that channel
    messages[name].append(complete_text)
    return jsonify({"messages": complete_text, "name": name})


@socketio.on("open channel")
def openChannel(data):
    channelTexts = messages[data["name"]]
    # Only store 100 items
    if len(channelTexts) > 100:
        # Remove the Oldest message
        channelTexts.pop(0)
    # Return channelTexts to DOM
    emit("channel opened", {"messages": channelTexts}, broadcast=False)


@socketio.on('flackbot')
def flackbot(data):
    # Create new mesage by Flackbot in the channel
    content = "New channel created "
    # Text object is a dictionary with 3 keys, the username, the text content and the timestamp
    text = {'username': 'Flackbot', 'content': content, 'date': data["date"]}
    messages[data["name"]].append(text)


@socketio.on("create channel")
def createChannel(data):
    # Check if the channel list is empty and add fist channel
    if len(channels) == 0:
        # Channels are empty add new channel
        channels.append(str(data["name"]))
        # Send the message
        message = "New Channel Created"
        emit("create feedback", {"message": message, "name": str(data["name"]), "status": 1}, broadcast=True)

    # Else if the channel list is not empty, check if an existing channel is in list
    else:
        if str(data["name"]) in channels:
            # Duplicate Channel, send error message
            message = "Sorry there is another channel with the same name"
            emit("create feedback", {"message": message, "status": 0}, broadcast=False)

        # Otherwise, add the channel to the list of channels
        else:
            channels.append(str(data["name"]))
            # Send the message
            message = "New Channel Created"
            emit("create feedback", {"message": message, "name": str(data["name"]), "status": 1}, broadcast=True)


@app.route("/", methods=["GET", "POST"])
def index():
    if session.get("username") is None:
        return render_template("index.html")
    else:
        return render_template("chat.html")


@app.route("/chat", methods=["GET", "POST"])
def chat():
    if request.method == "GET":
        # Getting the username variable stored in session
        if session.get("username") is None:
            return render_template("index.html")
        else:
            # If the user already entered a username, open the chat route
            return render_template("chat.html", username=session["username"], channels=channels)

    elif request.method == "POST":
        # Get the username sent from the post request
        username = str(request.form.get("username"))

        # Check in the list of usernames is empty
        if len(names) == 0:
            # No name exists in the list yet, add the user as first
            names.append(username)
            session["username"] = username
            # Open the chat route
            return render_template("chat.html", username=username, channels=channels)
        else:
            # If there were pre existing names
            # Check if this particular username didn't exist
            if username in names:
                # Username was already there, return error
                session["username"] == None
                return render_template("index.html", message="Username conflict, pick something else")
            else:
                # Username wasn't there, allow
                names.append(username)
                session["username"] = username
                # Open the chat route
                return render_template("chat.html", username=username, channels=channels)


