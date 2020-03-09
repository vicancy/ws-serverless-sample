const jwt = require('jsonwebtoken');
const axios = require("axios");
const {URL} = require('url');

// todo: url from token, error handling when REST api call fails
module.exports = function (_from, _connId, _context) {
    const endpoint = process.env["AzureSignalREndpoint"];
    if (!endpoint) throw "AzureSignalREndpoint is not set";
    const key = process.env["AzureSignalRAccessKey"];
    if (!key) throw "AzureSignalRAccessKey is not set";

    var url = new URL(endpoint);
    const host = url.toString();

    // no port for audience
    url.port = ''; 
    const audienceHost = url.toString();
    
    var getToken = function (path) {
        return "Bearer " + jwt.sign({}, key, {
            issuer: 'chat',
            subject: _from,
            audience: audienceHost + path,
            expiresIn: "12h",
            algorithm: "HS256"
        });
    }

    return {
        addToGroup: async (user, group) => {
            var log = "Adding " + user + " to group " + group;
            var path = "ws/api/v1/hubs/chat/groups/" + group + "/users/" + user;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);
            const response = await axios.put(url,
                null, {
                headers: { "Authorization": token }
            });
            return {
                type: 'log',
                text: log
            };
        },
        addConnectionToGroup: async (conn, group) => {
            // PUT /ws/api/v1/hubs/chat/groups/1/connections/123-456
            var log = "Adding " + conn + " to group " + group;
            var path = "ws/api/v1/hubs/chat/groups/" + group + "/connections/" + conn;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);

            const response = await axios.put(url,
                null, {
                headers: { "Authorization": token }

            });
            return {
                type: 'log',
                text: log
            };
        },
        removeFromGroup: async (user, group) => {
            // DELETE /ws/api/v1/hubs/chat/groups/1/users/a
            var log = "Removing " + user + " from group " + group;
            var path = "ws/api/v1/hubs/chat/groups/" + group + "/users/" + user;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);

            const response = await axios.delete(url, {
                headers: { "Authorization": token }
            });

            return {
                type: 'log',
                text: log
            };
        },
        removeFromAllGroup: async (user) => {
            // DELETE /ws/api/v1/hubs/chat/users/a/groups
            var log = "Removing " + user + " from all groups";
            var path = "ws/api/v1/hubs/chat/users/" + user + "/groups";
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);

            const response = await axios.delete(url, {
                headers: { "Authorization": token }
            });

            return {
                type: 'log',
                text: log
            };
        },
        removeConnectionFromGroup: async (conn, group) => {
            // DELETE /ws/api/v1/hubs/chat/groups/1/connections/a

            var log = "Removing " + conn + " from group " + group;
            var path = "ws/api/v1/hubs/chat/groups/" + group + "/connections/" + conn;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);

            const response = await axios.delete(url, {
                headers: { "Authorization": token }
            });

            return {
                type: 'log',
                text: log
            };
        },
        sendToGroup: async (group, content) => {
            // POST /ws/api/v1/hubs/chat/groups/{group}
            const log = "Sending to group " + group + ": " + JSON.stringify(content);
            const path = "ws/api/v1/hubs/chat/groups/" + group;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);
            const response = await axios.post(url, content, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
        sendToUser: async (user, content) => {
            // POST /ws/api/v1/hubs/chat/users/{user}
            var log = "Send to user " + user + ": " + JSON.stringify(content);
            var path = "ws/api/v1/hubs/chat/users/" + user;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);
            const response = await axios.post(url, content, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
        sendToConnection: async (connection, content) => {
            // POST /ws/api/v1/hubs/chat/connections/{connection}
            var log = "Send to connection " + connection + ": " + JSON.stringify(content);
            var path = "ws/api/v1/hubs/chat/connections/" + connection;
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);
            const response = await axios.post(url, content, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
        broadcast: async (content) => {
            // POST /ws/api/v1/hubs/chat
            var log = "Broadcast: " + JSON.stringify(content);
            var path = "ws/api/v1/hubs/chat";
            var url = host + path;
            var token = getToken(path);
            _context.log(log + ", url:" + url + ", token:" + token);
            const response = await axios.post(url, content, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            });

            return {
                type: 'log',
                text: log
            };
        },
    };
};