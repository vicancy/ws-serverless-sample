module.exports = function (context, api, table, user, connectionId) {
    const getChatKey = function (recipient) {
        return '_chats_user_' + [user, recipient].sort().join(';');
    }
    return {
        loadHistory: async function (recipient) {
            const chatKey = getChatKey(recipient);
            var chatContent = await table.queryChat(chatKey);
            var response = await api.sendToConnection(connectionId, chatContent);

            context.res = {
                body: {
                    type: 'log',
                    text: response,
                }
            };
        },
        send: async function (recipient, message) {
            const chatKey = getChatKey(recipient);
            const date = new Date().toISOString();
            var content = {
                to: recipient,
                from: user,
                fromId: connectionId,
                date: date,
                text: message
            };
            const chatKey = getChatKey(recipient);
            // insert the user registered
            var chatEntity = {
                PartitionKey: { '_': chatKey },
                RowKey: { '_': date },
                sentTime: date,
                content: { '_': JSON.stringify(content) },
            };
            await table.exec('insertOrReplaceEntity', 'chat', chatEntity);

            var response = await api.sendToUser(recipient, content);

            context.res = {
                body: response,
            };
        }
    }
}
