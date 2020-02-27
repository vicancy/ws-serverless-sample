const azure = require('azure-storage');
module.exports = function (_conn, _context) {
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    const table = azure.createTableService(_conn).withFilter(retryOperations);
    const exec = function (action, ...args){
        return new Promise((resolve, reject) => {
            let promiseHandling = (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            };
            args.push(promiseHandling);
            table[action].apply(table, args);
        });
    }
    return {
        query: function(){
            return new azure.TableQuery();
        },
        exec: exec,
        queryChat: async function(chatKey){
            const chatTable = 'chat';
            query = new azure.TableQuery().where("PartitionKey eq '" + chatKey + "'").select('sentTime', 'content').top(20);
            await exec('createTableIfNotExists', chatTable, t=>{
                if (t) throw t;
            });
            var chats = (await exec('queryEntities', chatTable, query, null)).entries.map(i => {
                return {
                    time: i.sentTime['_'],
                    content: i.content['_']
                };
            }).sort(i => i.time).map(i => i.content).join(',');
            return '[' + chats + ']';
        }
    }
};
