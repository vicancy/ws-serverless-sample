module.exports = function (context, api, table, user, connectionId) {
    return {
        send: async function (recipient, message) {
            const date = new Date().toISOString();
            var content = {
                to: recipient,
                from: user,
                fromId: connectionId,
                date: date,
                text: message
            };
            const chatKey = '_chats_user_' + [user, recipient].sort().join(';');
            // insert the user registered
            var chatEntity = {
                PartitionKey: { '_': chatKey },
                RowKey: { '_': date },
                sentTime: date,
                content: { '_': JSON.stringify(content) },
            };
            await table.exec('insertOrReplaceEntity', 'chat', chatEntity);

            var response = await api.sendToUser(message.recipient, content);

            context.res = {
                body: response,
            };
        }
    }
}
