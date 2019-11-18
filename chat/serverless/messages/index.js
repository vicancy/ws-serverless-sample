var api = require('./api');

var func = module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log(req.body);
    context.log(req.query.event);

    var event = req.query.event;

    // todo: need claims to pass the data
    var connectionId = req.query.connectionId;
    var user = req.query.user;

    if (event === "connect") {
        // do auth?
        context.res = {
            body: user + "(" + connectionId + ") logged in."
        }

    } else if (event === "disconnect") {
        // todo: integrate with Azure Storage
        console.log(user + "(" + connectionId + ") disconnected");
        // clean up
    } else if (event == "message") {
        if (req.body) {
            var response = '';
            var message = req.body;
            const recipient = message.recipient || user;
            if (message.group) {
                if (message.action) {
                    if (message.action === "add") {
                        response = await api.addToGroup(recipient, message.group);
                    } else if (message.action === "remove") {
                        response = api.removeFromGroup(recipient, message.group);
                    }
                } else {
                    response = api.sendToGroup(message.group, message.text);
                }
            } else {
                if (message.action) {
                    if (message.action === "broadcast") {
                        response = api.broadcast(message.text);
                    }
                }
                else {
                    // TODO: send to user
                    response = api.sendToUser(recipient, message.text);
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
        action: "add",
        group: "group1"
    }
};
func(context, req);