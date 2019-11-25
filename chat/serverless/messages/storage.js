const azure = require('azure-storage');
module.exports = function (_conn, _context) {
    var retryOperations = new azure.ExponentialRetryPolicyFilter();
    const table = azure.createTableService(_conn).withFilter(retryOperations);
    return {
        query: function(){
            return new azure.TableQuery();
        },
        exec: function(action, ...args){
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
    }
};
