const url = "https://lianwei-ws-1.servicedev.signalr.net/";

var func = module.exports = async function (context, req) {
    var event = req.query.event;

    // todo: need claims to pass the data
    var connectionId = req.query.connectionId;
    var user = req.query.user;

    if (event === "connect") {
        // do auth?
        context.res = {
            body: {
                type: 'alert',
                text: user + "(" + connectionId + ") logged in."
            }
        }

    } else if (event === "disconnect") {
        // todo: integrate with Azure Storage
        context.log(user + "(" + connectionId + ") disconnected");
        // clean up
    } else if (event == "message") {
        if (req.body) {
            var api = require('./api')(user, connectionId, url);
            var response = '';
            var message = req.body;
            const recipient = message.recipient || user;
            if (message.group) {
                if (message.action) {
                    if (message.action === "add") {
                        response = await api.addToGroup(recipient, message.group);
                    } else if (message.action === "remove") {
                        response = await api.removeFromGroup(recipient, message.group);
                    }
                } else {
                    response = await api.sendToGroup(message.group, message.text);
                }
            } else {
                if (message.action) {
                    if (message.action === "broadcast") {
                        response = await api.broadcast(message.text);
                    }
                }
                else {
                    context.log("Broadcast as by default");
                    response = await api.broadcast(message.text);
                }
            }

            context.res = {
                body: response,
            };
            context.log(context.res);
        } else {
            context.res = {
                status: 400,
                body: {
                    type: 'error',
                    code: 400,
                    text: "Invalid message body."
                }
            }
        }
    }
    else {
        context.res = {
            status: 400,
            body: {
                type: 'error',
                code: 400,
                text: "Invalid event."
            }
        };
    }
};


// for local test
var context = {
    res: { body: "" },
    log: console.log
};
var req = {
    query: {
        user: "user1",
        connectionId: "123",
        event: "message"
    },
    body: {
        action: "broadcast",
        text: "Hello world"
    }
};
func(context, req);