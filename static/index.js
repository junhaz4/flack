document.addEventListener('DOMContentLoaded', ()=>{

    var currentChannel= "none"
    var currentChannelName;
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    var channelName_;
    // Function to create channel
    document.querySelector('#create').onclick = function createChannel(){
        var channelName = prompt("Enter the channel Name");
        // If channel name is empty
        if(channelName===""){
            alert ("Channel name cannot be empty");
        }
        else{
            // Send the data to flask server
            channelName_=channelName;
            socket.emit('create channel', {'name': channelName});
        }
    }

    // Alert the feedback received from create channel broadcast
    socket.on('create feedback', data =>{

        const li = document.createElement('li');
        switch(data.status){
            // Status 1 for successful, 0 for not successful
            case 1:

                // Giving channels an ID
                li.setAttribute('class', 'channel');
                li.innerHTML = `#${data.name}`;
                // If everything was successful, add channel to list of channels
                document.querySelector('#channels').append(li);
                alert (data.message);
                break;
            default:
                alert (data.message);
                break;
        }
        // Give all channels an id
        $('#channels li').each(function(i,el){
            el.id = 'chn'+ i;
        });
        // Add a Flack bot text to the channel
        var currentDate = new Date();
            var dateTime =  currentDate.getDate() + "/"
                            + (currentDate.getMonth()+1)  + "/"
                            + currentDate.getFullYear() + " @ "
                            + currentDate.getHours() + ":"
                            + currentDate.getMinutes() + ":"
                            + currentDate.getSeconds();
        // Get the current id of the newly created channel
        var id = li.getAttribute('id').substring(3)
        socket.emit('flackbot', {'id': id , 'date': dateTime, 'name': data.name})
    })

    // What happens when channels are clicked.

    document.getElementById("channels").addEventListener("click", function (e){
        // e is the targeted element or channel
        // Checking if e is a list item
        if(e.target && e.target.nodeName =="LI"){
           var id = e.target.id;
           // Removing the prefix from the id
           var sub_id = id.substring(3)
           var name = e.target.innerHTML;
           // Setting that channels name to the heading
           document.getElementById("heading").innerHTML=name.substring(1);
           // Emit channel name to flask to create a list to hold messages
           socket.emit('open channel', {'id': sub_id, 'name': name.substring(1)});
           currentChannel = sub_id;
           currentChannelName = name.substring(1);

        }
    })

    // Defining a function that creates new messages formated in a particular style when called
    function createNewMessage (message){
        var name_time_div = document.createElement('div');
        name_time_div.setAttribute('class', 'name_time');

        var name_paragraph = document.createElement('p');
        name_paragraph.setAttribute('class', 'nameParagraph');
        name_paragraph.innerHTML =`${message["username"]}`

        var time_paragraph = document.createElement('p');
        time_paragraph.setAttribute('class', 'timeParagraph')
        time_paragraph.innerHTML =`${message["date"]}`

        var content_paragraph =document.createElement('p');
        content_paragraph.setAttribute('class', 'contentParagraph');
        content_paragraph.innerHTML =`${message["content"]}`

        //append views
        name_time_div.appendChild(name_paragraph)
        name_time_div.appendChild(time_paragraph)

        var list = document.createElement('li');
        list.appendChild(name_time_div)
        list.appendChild(content_paragraph)
        document.querySelector('#all_messages').append(list)
    }

    socket.on('channel opened', data =>{
        var messages= data.messages;
        // Refresh the list
        document.querySelector('#all_messages').innerHTML =""
        messages.forEach(function(element){
            createNewMessage(element)
        })


    })

    // What happens when text form is submitted
    document.querySelector("#messageForm").onsubmit = () =>{
        const request = new XMLHttpRequest();
        request.open('POST', '/text');

        // Callback goes here
        request.onload = () => {

            // Extract JSON data from request
            const data = JSON.parse(request.responseText);
            var messages = data.messages;
            // Calling the function to create new message
            createNewMessage(messages);
            // Clear the input field
            document.getElementById('textField').value=""

        }
        // Callback goes here

        // Check if no channel has been selected
        if (currentChannel === "none"){
           alert ("Please select a channel")
        }

        // User selected a channel
        // Check if text message field is empty
        const text_to_send= document.querySelector('#textField').value;
        if(text_to_send ===""){
            // Field is empty, return error
            document.getElementById("errorField").innerHTML ="Text cannot be empty"
            return false;
        }
        // Text field is not blank
        // Set error text field to empty

        document.getElementById("errorField").innerHTML ="";
        // Get the date and time
        var currentDate = new Date();
        var dateTime =  currentDate.getDate() + "/"
                        + (currentDate.getMonth()+1)  + "/"
                        + currentDate.getFullYear() + " @ "
                        + currentDate.getHours() + ":"
                        + currentDate.getMinutes() + ":"
                        + currentDate.getSeconds();

        var request_data = new FormData();
        request_data.append('id', currentChannel)
        request_data.append('text', text_to_send)
        request_data.append('date', dateTime)
        request_data.append('name', currentChannelName)
        // Send request
        request.send(request_data);
        // Send to all clients
        socket.emit('send text', {'text': text_to_send, 'date': dateTime, 'name':currentChannelName});
        return false;
    };

    // What happens when a new message is broadcasted from flask server
    socket.on('new message', data =>{
        // Get the contents of them message
        var message = data.message;
        // Get the channel where the message was sent
        var messageChannel = data.name;
        // Only load the message if that channel is currently opened
        var openedChannel = document.getElementById('heading').innerHTML
        if(openedChannel === messageChannel){
            // Load the message here
            // Call function to create new message
            createNewMessage(message);
        }
    })



});