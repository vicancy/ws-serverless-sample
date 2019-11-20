
const connectionString = 'Endpoint=http://localhost;AccessKey=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;Port=8080;Version=1.0;';
const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const audience = 'http://localhost/ws/client/';
const url = 'ws://localhost:8080/ws/client/?hub=chat&serverless=true';
const fs = require('fs');
const jwt = require('jsonwebtoken');
const uri = require('url');
var func = module.exports = async function (context, req) {
    const user = (req.headers["x-MS-CLIENT-PRINCIPAL-NAME"]) || req.query.name || (req.body && req.body.name);
    if (user) {
        const options = {
            issuer: 'chat',
            subject: user,
            audience: audience,
            expiresIn: "12h",
            algorithm: "HS256"
        };

        // todo: which one can be trusted?
        var urlparts = uri.parse(req.originalUrl);
        const payload = {
            "asrs.s.rfh": urlparts.protocol + '//' + urlparts.host,
        };

        const token = jwt.sign(payload, key, options);
        const clientUrl = url + "&access_token=" + token;
        context.res = {
            body: {
                url: clientUrl
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
    res: { body: "" },
    log: console.log
};
var req = {
    headers: {},
    originalUrl: "https://a/b",
    query: { name: "hello" }
};
func(context, req);
console.debug(context.res.body);
