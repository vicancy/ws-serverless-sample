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

    if (event === "connect") {
        // create the table chat
        await table.exec('createTableIfNotExists', 'chat');
        // insert the user-conn pair
        var date = new Date().toISOString();

        // insert the user registered
        var userEntity = {
            PartitionKey: {'_': '_users'},
            RowKey: {'_': user },
            user: {'_': user},
            connectTime: {'_': date},
        }
        await table.exec('insertOrReplaceEntity', 'chat', userEntity);

        // TODO: ask Service for online status
        
        // get top 50 the users
        var userQuery = table.query().where("PartitionKey eq '_users'").select('user').top(50);
        var users = (await table.exec('queryEntities', 'chat', userQuery, null)).entries.map(i=>i.user['_']);
        context.res = {
            body: {
                type: 'connected',
                users: users,
                user: user,
                connection: connectionId,
            }
        };

        await api.globalsync({
            type: 'sync',
            event: 'addUser',
            user: user,
            conn: connectionId,
        });
    } else if (event === "disconnect") {
        // todo: integrate with Azure SignalR
        // todo: user can have many connections
        var log = user + "(" + connectionId + ") disconnected";
        context.log(log);
        await api.globalsync({
            type: 'log',
            text: log,
        });
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
        connectionId: new Date().toISOString(),
        event: "connect"
    },
    body: {
        action: "broadcast",
        text: "Hello world"
    }
};
func(context, req);