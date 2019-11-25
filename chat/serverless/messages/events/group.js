module.exports = function (context, api, table, group, user, connectionId) {
    const chatKey = '_chats_group_' + group;
    return {
        add: async function (recipient) {
            var userGroup = {
                PartitionKey: { '_': '_usergroups_' + recipient },
                RowKey: { '_': group },
                user: { '_': recipient },
                joinedTime: { '_': new Date().toISOString() },
                group: { '_': group },
                chatKey: { '_': chatKey },
            }
            await table.exec('insertOrReplaceEntity', 'chat', userGroup);

            var response = await api.addToGroup(recipient, group);

            context.res = {
                body: response,
            };
        },
        remove: async function (recipient) {
            var userGroup = {
                PartitionKey: { '_': '_usergroups_' + recipient },
                RowKey: { '_': group },
            }
            await table.exec('deleteEntity', 'chat', userGroup);

            var response = await api.removeFromGroup(recipient, group);
            context.res = {
                body: response,
            };
        },
        send: async function (messageContent) {
            context.log('Group sending ' + messageContent);
            const date = new Date().toISOString();
            var content = {
                group: group,
                from: user,
                fromId: connectionId,
                date: date,
                text: messageContent
            };

            // insert the user registered
            var chatEntity = {
                PartitionKey: { '_': chatKey },
                RowKey: { '_': date },
                sentTime: date,
                content: { '_': JSON.stringify(content) },
            }

            await table.exec('insertOrReplaceEntity', 'chat', chatEntity);

            var response = await api.sendToGroup(group, content);

            context.res = {
                body: response,
            };
        }
    };
};
