const axios = require("axios");
const url = "http://localhost:8080/";
module.exports = (function () {
    return {
        addToGroup:  async (user, group) =>{
            console.log("Adding " + user + " to group " + group);
            const response = await axios.put(url +"ws/api/v1/hubs/chat/groups/"+group+"/users/" + user,
                null, {

                });
                return response.data;
        },
        removeFromGroup: (user, group)=>{
            // TODO; remove from group
            response = "Removing " + user + " from group " + group;
            console.log(response);
            return response;
        },
        sendToGroup: (group, content)=>{
            // TODO: send to group
            response = "Sending to group " + group + ": " + content;
            return response;
        },
        sendToUser: (user, content) =>{
            response = "Send to user " + user + ": " + content;
            return response;
        },
        broadcast: (content)=>{
            // TODO: broadcast
            response = "Broadcast: " + content;
            return response;
        },
    };
})();