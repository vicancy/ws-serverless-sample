let url = "http://localhost:8080";
const conn = process.env["AzureSignalRConnectionString"];
const storageConn = process.env["AzureWebJobsStorage"] || "UseDevelopmentStorage=true";

if (conn) {
    const host = /Endpoint=(.*?);/g.exec(conn)[1];
    const portmatch = /Port=(.*?);/g.exec(conn);
    const portSuffix = portmatch ? ':' + portmatch[1] : '';
    url = host + portSuffix;
}

var func = module.exports = async function (context, req) {
    var event = req.query.event;
    // todo: need claims to pass the data
    var connectionId = req.query.connectionId;
    var user = req.query.user;

    const api = require('./api')(user, connectionId, url, context);
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
        action: "loadHistory",
        group: "group1",
        recipient: "_chats_group_group1"
    }
};
func(context, req);