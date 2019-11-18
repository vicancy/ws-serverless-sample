var http = require('http');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log(req.body);
    context.log(context.req.query.event);

    var event = context.req.query.event;

    // need claims to pass the data
    var connectionId = context.req.query.connectionId;
    var user = context.req.query.user;

    if (event === "connect") {
        // do auth?
        context.res = {
            body: user + "(" + connectionId + ") logged in."
        }
        
    } else if (event === "disconnect") {
        // todo: integrate with Azure Storage
        console.log(user + "(" + connectionId + ") disconnected");
        // clean up
    } else if (event == "message"){
        if (req.body) {
            var response = '';
            var message = req.body;
            if (message.group){
                if (message.action){
                    const recipient = message.recipient || "self";
                    if (message.action === "add"){
                        // TODO: add to group
                        response = "Adding " + recipient + " to group " + message.group;
                        console.log(response);
                    } else if (message.action === "remove"){
                        // TODO; remove from group
                        response = "Removing " + recipient + " from group " + message.group;
                        console.log(response);
                    }
                } else{
                    // TODO: send to group
                    response = "Sending to group " + message.group + ": " + message.text;
                }
            } else {
                if (message.action){
                    if (message.action === "broadcast") {
                        // TODO: broadcast
                        response = "Broadcast: " + message.text;
                    }
                }
                else {
                    // TODO: send to user
                    response = "Send to user " + message.recipient + ": " + message.text;
                }
            }
            context.res = {
              body: response,
            };
        } else {
            context.res = {
                status: 400,
                body: "Invalid message body."
            }
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Invalid event."
        };
    }
};