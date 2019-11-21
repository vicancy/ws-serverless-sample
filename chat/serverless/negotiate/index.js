const conn = '';
const key = /AccessKey=(.*?);/g.exec(conn)[1];
const endpoint = /Endpoint=(.*?);/g.exec(conn)[1];
const port = /Port=(.*?);/g.exec(conn)[1];
const audience = endpoint + '/ws/client/';
var wsurl = endpoint.replace('http', 'ws');
if(port){
    wsurl += ':' + port;
}
const url = wsurl + '/ws/client/?hub=chat&serverless=true';
const fs = require('fs');
const jwt = require('jsonwebtoken');
const uri = require('url');
var func = module.exports = async function (context, req) {
    const user = (req.headers["x-ms-client-principal-name"]) || req.query.name || (req.body && req.body.name);
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
            //"asrs.s.rfh": 'https://lianwei-wsmessages.azurewebsites.net/',
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
            body: "Bad user name."
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
