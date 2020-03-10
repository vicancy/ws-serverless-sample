var path = require('path');
var fs = require('fs');
module.exports = async function (context, req) {
    var contentFile = path.join(context.executionContext.functionDirectory, "index.html");
    context.log(contentFile);
    var content = fs.readFileSync(contentFile, { encoding: 'utf-8' });

    context.res = {
        headers: {
            'Content-Type': "text/html"
        },
        body: content
    };
};