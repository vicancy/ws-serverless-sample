const url = "http://localhost:8080/";

var func = module.exports = async function (context, req) {
    var event = req.query.event;

    // todo: need claims to pass the data
    var connectionId = req.query.connectionId;
    var user = req.query.user;
    var api = require('./api')(user, connectionId, url, context);

    if (event === "connect") {
        // do auth?
        await api.globalsync({
            type: 'sync',
            event: 'addUser',
            user: user,
            conn: connectionId,
        });
        context.res = {
            body: {
                type: 'alert',
                text: user + "(" + connectionId + ") logged in."
            }
        }

    } else if (event === "disconnect") {
        // todo: integrate with Azure Storage
        // todo: user can have many connections
        await api.globalsync({
            type: 'sync',
            event: 'removeUser',
            user: user,
            conn: connectionId,
        });
        context.log(user + "(" + connectionId + ") disconnected");
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
                        response = await api.removeFromGroup(recipient, message.group);
                    }
                } else {
                    response = await api.sendToGroup(message.group, message.text);
                }
            } else if (message.recipient) {
                response = await api.sendToUser(message.recipient, message.text);
            }
            else {
                context.log("Broadcast as by default");
                response = await api.broadcast(message.text);
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