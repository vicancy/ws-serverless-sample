module.exports = function (context, api, table, user, connectionId) {
    return {
        broadcast: async function(message){
            const date = new Date().toISOString();
            context.log("Broadcast as by default");
            const chatKey = "_chats_broadcast";
            var content = {
                from: user,
                fromId: connectionId,
                date: date,
                text: message
            };
            var chatEntity = {
                PartitionKey: { '_': chatKey },
                RowKey: { '_': date },
                sentTime: date,
                content: { '_': JSON.stringify(content) },
            };
        
            await table.exec('insertOrReplaceEntity', 'chat', chatEntity);
            var response = await api.broadcast(content);
        
            context.res = {
                body: response,
            };
        }
    };
}
