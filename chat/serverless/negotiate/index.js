
const connectionString = 'Endpoint=http://localhost;AccessKey=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;Port=8080;Version=1.0;';
const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const audience = 'http://localhost/ws/client/';
const url = 'ws://localhost:8080/ws/client/?hub=chat&serverless=true';
const fs = require('fs');
const jwt = require('jsonwebtoken');

var func = module.exports = async function (context, req) {
    if (req.query.name || (req.body && req.body.name)) {
        const user = (req.query.name || req.body.name);
        const options = {
            issuer:  'chat',
            subject: user,
            audience:  audience,
            expiresIn:  "12h",
            algorithm:  "HS256"
        };
    
        const payload = {
            "user" : user,
        };

        const token = jwt.sign(payload, key, options);
        const clientUrl = url + "&access_token=" + token;
        context.res = {
            body: {
                url : clientUrl
            }
        };
    }
    else {
        context.res = {
            status: 401,
        };
    }
};

// for local test
var context = {
    res : {body: ""}
};
var req = { 
    query: {name : "hello"}
};
func(context, req);
console.debug(context.res.body);
