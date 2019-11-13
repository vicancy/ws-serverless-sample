module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log(req.body);
    context.log(context.req.query.event);

    var event = context.req.query.event;

    // need claims to pass the data
    var connectionId = context.req.query.connectionId;
    var user = context.req.query.user;

    if (event === "connect") {
        // do auth?
        
    } else if (event === "disconnect") {
        // clean up
    }
    if (req.body) {
        context.res = {
          body: "Hello" + req.body  
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
};