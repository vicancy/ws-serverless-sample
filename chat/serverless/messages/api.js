const axios = require("axios");

// todo: url from token, error handling when REST api call fails
module.exports = function (_from, _conn, _url) {
    return {
        addToGroup: async (user, group) => {
            var log = "Adding " + user + " to group " + group;
            console.log(log);
            const response = await axios.put(_url + "ws/api/v1/hubs/chat/groups/" + group + "/users/" + user,
                null, {

            });
            return {
                type: 'log',
                text: log
            };
        },
        addConnectionToGroup: async (conn, group) => {
            // PUT /ws/api/v1/hubs/chat/groups/1/connections/123-456
            var log = "Adding " + conn + " to group " + group;
            console.log(log);
            const response = await axios.put(_url + "ws/api/v1/hubs/chat/groups/" + group + "/connections/" + conn,
                null, {

            });
            return {
                type: 'log',
                text: log
            };
        },
        removeFromGroup: async (user, group) => {
            // DELETE /ws/api/v1/hubs/chat/groups/1/users/a
            var log = "Removing " + user + " from group " + group;
            console.log(log);
            const response = await axios.delete(_url + "ws/api/v1/hubs/chat/groups/" + group + "/users/" + user, {});

            return {
                type: 'log',
                text: log
            };
        },
        removeFromAllGroup: async (user) => {
            // DELETE /ws/api/v1/hubs/chat/users/a/groups
            var log = "Removing " + user + " from all groups";
            console.log(log);

            const response = await axios.delete(_url + "ws/api/v1/hubs/chat/users/" + user + "/groups", {});

            return {
                type: 'log',
                text: log
            };
        },
        removeConnectionFromGroup: async (conn, group) => {
            // DELETE /ws/api/v1/hubs/chat/groups/1/connections/a

            var log = "Removing " + conn + " from group " + group;
            console.log(log);
            const response = await axios.delete(_url + "ws/api/v1/hubs/chat/groups/" + group + "/connections/" + conn, {});

            return {
                type: 'log',
                text: log
            };
        },
        sendToGroup: async (group, content) => {
            // POST /ws/api/v1/hubs/chat/groups/{group}
            const log = "Sending to group " + group + ": " + content;
            console.log(log);
            const response = await axios.post(_url + "ws/api/v1/hubs/chat/groups/" + group,
                {
                    from: _from,
                    fromId: _conn,
                    date: new Date().toISOString(),
                    text: content
                }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
        sendToUser: async (user, content) => {
            // POST /ws/api/v1/hubs/chat/users/{user}
            var log = "Send to user " + user + ": " + content;
            console.log(log);
            const response = await axios.post(_url + "ws/api/v1/hubs/chat/users/" + user,
                {
                    from: _from,
                    fromId: _conn,
                    date: new Date().toISOString(),
                    text: content
                }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
        broadcast: async (content) => {
            // POST /ws/api/v1/hubs/chat
            var log = "Broadcast: " + content;
            console.log(log);
            const response = await axios.post(_url + "ws/api/v1/hubs/chat/",
                {
                    from: _from,
                    fromId: _conn,
                    date: new Date().toISOString(),
                    text: content
                }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
    };
};