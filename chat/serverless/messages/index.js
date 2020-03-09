const storageConn = process.env["AzureWebJobsStorage"] || "UseDevelopmentStorage=true";
// URLSearchParams is not recognizable in Azure Functions, import a polyfill
const URLSearchParams = require('url-search-params');
var func = module.exports = async function (context, req) {
    var event = req.query.event;
    // todo: need claims to pass the data
    // due to bug https://github.com/Azure/azure-functions-nodejs-worker/issues/274
    var connectionId = context.bindingData.headers['x-ASRS-Connection-Id'];
    var user = context.bindingData.headers['x-ASRS-User-Id'];

    context.log(req);

    if (!connectionId || !event) {
        context.res = { status: 400 }
        return;
    }
    if (!user) {
        // try to auth user
        if (event === "connect") {
            // read the auth from the query string for demo
            var request = new URLSearchParams(context.bindingData.headers['x-ASRS-Client-Query']);
            var user = request.get('user');
            if (!user) {
                context.res = { status: 401 }
                return;
            }
            
        }else {
            context.res = { status: 401 }
            return;
        }
    }

    const api = require('./api')(user, connectionId, context);
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
        if (message.action === 'load') {
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
        if (message.action === 'load') {
            await user.loadHistory(message.recipient);
            return;
        }
        await user.send(message.recipient, message.text);
    }
    else {
        var broadcast = require('./events/broadcast')(context, api, table, user, connectionId);
        if (message.action === 'load') {
            await broadcast.loadHistory();
            return;
        }
        await broadcast.broadcast(message.text);
    }
};