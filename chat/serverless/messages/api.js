const axios = require("axios");
const url = "http://localhost:8080/";
module.exports = (function () {
    return {
        addToGroup: async (user, group) => {
            console.log("Adding " + user + " to group " + group);
            const response = await axios.put(url + "ws/api/v1/hubs/chat/groups/" + group + "/users/" + user,
                null, {

            });
            return response.data;
        },
        addConnectionToGroup: async (conn, group) => {
            // PUT /ws/api/v1/hubs/chat/groups/1/connections/123-456
            console.log("Adding " + conn + " to group " + group);
            const response = await axios.put(url + "ws/api/v1/hubs/chat/groups/" + group + "/connections/" + conn,
                null, {

            });
            return response.data;
        },
        removeFromGroup: async (user, group) => {
            // DELETE /ws/api/v1/hubs/chat/groups/1/users/a

            console.log("Removing " + user + " from group " + group);
            const response = await axios.delete(url + "ws/api/v1/hubs/chat/groups/" + group + "/users/" + user, {});
            return response.data;
        },
        removeFromAllGroup:async  (user) => {
            // DELETE /ws/api/v1/hubs/chat/users/a/groups
            console.log("Removing " + user + " from all groups");

            const response = await axios.delete(url + "ws/api/v1/hubs/chat/users/" + user + "/groups", {});
            return response.data;
        },
        removeConnectionFromGroup: async (conn, group) => {
            // DELETE /ws/api/v1/hubs/chat/groups/1/connections/a

            console.log("Removing " + conn + " from group " + group);
            const response = await axios.delete(url + "ws/api/v1/hubs/chat/groups/" + group + "/connections/" + conn, {});
            return response.data;
        },
        sendToGroup:async  (group, content) => {
            // TODO: send to group
            response = "Sending to group " + group + ": " + content;
            return response;
        },
        sendToUser: async (user, content) => {
            response = "Send to user " + user + ": " + content;
            return response;
        },
        broadcast:async  (content) => {
            // POST /ws/api/v1/hubs/chat
            console.log("Broadcast: " + content);
            const response = await axios.post(url + "ws/api/v1/hubs/chat/",
                content, {

            });
            return response.data;
        },
    };
})();