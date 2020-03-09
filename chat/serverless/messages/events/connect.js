
module.exports = function (context, api, table, user, connectionId) {
    return {
        connect: async function () {
            var date = new Date().toISOString();
            // create the table chat
            await table.exec('createTableIfNotExists', 'chat');
            // insert the user-conn pair

            // insert the user registered
            var userEntity = {
                PartitionKey: { '_': '_users' },
                RowKey: { '_': user },
                user: { '_': user },
                connectTime: { '_': date },
            }

            await table.exec('insertOrReplaceEntity', 'chat', userEntity);

            // TODO: ask Service for online status

            // get top 50 the users
            var userQuery = table.query().where("PartitionKey eq '_users'").select('user').top(50);
            var users = (await table.exec('queryEntities', 'chat', userQuery, null)).entries.map(i => i.user['_']).sort();

            // get top 20 chats for top 10 groups

            var userGroupQuery = table.query().where("PartitionKey eq '_usergroups_" + user + "'").select('group').top(10);
            var groups = (await table.exec('queryEntities', 'chat', userGroupQuery, null)).entries.map(i => i.group['_']).sort();

            // return back the subprotocol and the user authed
            context.res = {
                headers: {
                    'sec-websocket-protocol': 'protocol1',
                    'x-asrs-user-id': user
                },
                body: {
                    type: 'connected',
                    users: users,
                    user: user,
                    groups: groups,
                    connection: connectionId,
                }
            };

            await api.broadcast({
                type: 'sync',
                event: 'addUser',
                user: user,
                conn: connectionId,
            });
            context.log(context.res.body.groups);
        },
        disconnect: async function () {
            // todo: integrate with Azure SignalR
            // todo: user can have many connections
            var log = user + "(" + connectionId + ") disconnected";
            context.log(log);
            var response = await api.broadcast({
                type: 'log',
                text: log,
            });

            context.res = {
                body: response,
            };
        }
    }
};