const jwt = require('jsonwebtoken');
const uri = require('url');

const conn = process.env["AzureSignalRConnectionString"] || 'Endpoint=http://localhost;AccessKey=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;Port=8080;Version=1.0;';
const key = /AccessKey=(.*?);/g.exec(conn)[1];
const endpoint = /Endpoint=(.*?);/g.exec(conn)[1];
const portmatch = /Port=(.*?);/g.exec(conn);
const port = portmatch ? ':' + portmatch[1] : '';
const audience = endpoint + '/ws/client/';
const url = endpoint.replace('http', 'ws') + port + '/ws/client/?hub=chat&serverless=true';

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
            body: "To test the app, please add ?name={username} query string."
        };
    }
};

async function queryEntities(tableService, ...args) {
    return new Promise((resolve, reject) => {
        let promiseHandling = (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        };
        args.push(promiseHandling);
        tableService.queryEntities.apply(tableService, args);
    });
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
