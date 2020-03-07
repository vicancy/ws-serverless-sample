const jwt = require('jsonwebtoken');
const uri = require('url');

const conn = process.env["AzureSignalRConnectionString"] || 'Endpoint=http://localhost;AccessKey=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGH;Port=8080;Version=1.0;';
const key = /AccessKey=(.*?);/g.exec(conn)[1];
const endpoint = /Endpoint=(.*?);/g.exec(conn)[1];
const portmatch = /Port=(.*?);/g.exec(conn);
const port = portmatch ? ':' + portmatch[1] : '';
const audience = endpoint + '/ws/client/';
const url = endpoint.replace('http', 'ws') + port + '?hub=chat&serverless=true';
const upstreamUrl = process.env["UpstreamUrl"] || 'http://localhost:7071/api/messages?event={event}';
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
        const payload = {
            "asrs.s.rfh": upstreamUrl,
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
            body: "To test the app, please add ?name={username} query string."
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
