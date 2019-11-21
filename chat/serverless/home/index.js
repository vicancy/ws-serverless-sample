var path = require('path');
var fs = require('fs');
module.exports = async function (context, req) {
    context.log(context);
    context.log(context.functionDirectory);
    context.log(context.executionContext.functionDirectory);
    var contentFile = path.join(context.executionContext.functionDirectory, "index.html");
    context.log(contentFile);
    var content = fs.readFileSync(contentFile, { encoding: 'utf-8' });
    var name = (req.headers["x-ms-client-principal-name"]) || req.query.name || (req.body && req.body.name);
    if (name) {
        var html = content.replace(/%%%___user___%%%/g, name)
        context.res = {
            headers: {
                'Content-Type': "text/html"
            },
            body: html
        };
    }
    else {
        context.res = {
            status: 401,
            body: "Bad user name."
        };
    }
};