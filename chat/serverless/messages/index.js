const conn = process.env["AzureSignalRConnectionString"] || "Endpoint=http://localhost;AccessKey=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGH;Port=8080;Version=1.0;";
const storageConn = process.env["AzureWebJobsStorage"] || "UseDevelopmentStorage=true";

var func = module.exports = async function (context, req) {
    var event = req.query.event;
    // todo: need claims to pass the data
    var connectionId = req.headers['x-asrs-connection-id'];
    var user = req.headers['x-asrs-user-id'];
    
    context.log(req);
    
    if (!connectionId || !user || !event){
        context.res = {
            status: 400,
            body: {
                type: 'error',
                code: 400,
                text: "Bad request."
            }
        } 
        return;
    }

    const api = require('./api')(user, connectionId, conn, context);
    const table = require('./storage')(storageConn, context);
    if (event === "connect" || event === "disconnect") {
        var connect = require('./events/connect')(context, api, table, user, connectionId)[event];
        await connect();
        return;
    }

    if (!req.body) {
        context.res = {
            status: 400,
            body: {
                type: 'error',
                code: 400,
                text: "Invalid message body."
            }
        }
    }

    // otherwise it is message sending
    var message = req.body;

    if (message.group) {
        var group = require('./events/group')(context, api, table, message.group, user, connectionId);
        const recipient = message.recipient || user;
        if (message.action === 'loadHistory'){
            await group.loadHistory();
            return;
        }
        if (message.action === 'add' || message.action === 'remove') {
            var action = group[message.action];
            await action(recipient);
        } else {
            await group.send(message.text);
        }
    } else if (message.recipient) {
        var user = require('./events/user')(context, api, table, user, connectionId);
        if (message.action === 'loadHistory'){
            await user.loadHistory(message.recipient);
            return;
        }
        await user.send(message.recipient, message.text);
    }
    else {
        var broadcast = require('./events/broadcast')(context, api, table, user, connectionId);
        if (message.action === 'loadHistory'){
            await broadcast.loadHistory();
            return;
        }
        await broadcast.broadcast(message.text);
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
        connectionId: new Date().toISOString(),
    },
    body: {
        text: "Hello world",
        action: "add",
        group: "_chats_group_group1"
    }
};
req.headers = {
        'x-asrs-connection-id': req.query.connectionId,
        'x-asrs-user-id': req.query.user
    };
func(context, req);