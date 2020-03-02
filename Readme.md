# Introduction
This is a simple chat sample, built upon Azure Function and the Raw WebSocket feature of Azure SignalR Service.

There are three Functions inside this repo:
1. [The Function to return the Chat's webpage](./chat/serverless/home)
2. [The Function to handle negotiate requests](./chat/serverless/negotiate)
3. [The Function to handle incoming WebSocket requests](./chat/serverless/messages)

## The Function to return the Chat's webpage
The Chat's webpage is based on pure html and the [Vue.js](https://cn.vuejs.org/index.html) JavaScript framework. What the function does in [index.js](./chat/serverless/home/index.js) is simply return the content of [index.html](./chat/serverless/home/index.html), providing the negotiate endpoint value in Environment variable `WebsiteUrl` read from the Function's config.

## The Function to handle negotiate requests
This Function is to handle the incoming client request, auth the user, and provide the Azure SignalR Service's endpoint and access token to the service, with the connection string `AzureSignalRConnectionString` provided in config. The routing patterns for the Raw WebSocket feature of Azure SignalR Service are as below, `{hub}` is required while `{format}` can be ignored. When ignored, the default value of the WebSocket transfer format is `text`.
1. `/ws/client?hub={hub}&format={text|binary}`
2. `/ws/client/hubs/{hub}?format={text|binary}`
3. `/ws/client/hubs/{hub}/formats/{text|binary}`

To make the demo workflow simpler, current auth workflow supports reading the auth info from request's query `name`. It can also read from AAD login info if AAD is set for the Function App.

In the demo, we provide a workaround for setting the Upstream URL pattern as providing a claim as `asrs.s.rfh` and read the value from Environment variable `UpstreamUrl`, as for now the portal access is not yet ready. Later on, when Azure SignalR Service adds the ability to set the Upstream Settings from portal, this workaround will be obsoleted.

The Upstream URL pattern has 3 supported parameters, `{event}`, `{hub}`, `{category}`. These 3 parameters will be evaluated and replace dynamically in Azure SignalR for a single client request. For example, when a request `/ws/client/hubs/chat` comes in, with a configured Upstream URL pattern `http://localhost:7071/api/messages?event={event}`, when the client connects, it will first POST to this URL: `http://localhost:7071/api/messages?event=connect`.

|Event  | {event} | {category} |
|-----------| -------------| ----------------|
|Connect | `connect` | `connections` |
|Message | `message` | `messages` |
|Disconnect | `disconnect` | `connections` |

## The Function to handle incoming WebSocket requests
After the client established WebSocket connection with Azure SignalR Service. Every WebSocket frame triggers a HTTP request to the Upstream URL. The following headers are added by Azure SignalR Service so that the Function can read the info from the request headers:

* `X-ASRS-Hub`: `{hubname}`
* `X-ASRS-Category`: `connections`
* `X-ASRS-Connection-Id`: `{connection-id}`
* `X-ASRS-Event`: `connect`
* `X-ASRS-User-Id`: `{user-id}`
* `X-ASRS-User-Claims`: `{user-claims}`
* `X-ASRS-Signature`: `sha256={request-hash-primary},sha256={request-hash-secondary}`
* `X-ASRS-Client-Query-String?`: `{query-string}` 

In this Function, it reads payloads from the incoming request, the response of the incoming request will be delivered to the client by Azure SignalR service. Also, Azure SignalR Service provides REST APIs to handle the WebSocket connections:

1. Broadcast messages: 
    `POST /ws/api/v1/hubs/{hub}`
1. Send message to user:
    `POST /ws/api/v1/hubs/{hub}/users/{id}`
1. Send message to one connection:
    `POST /ws/api/v1/hubs/{hub}/connections/{connectionId}`
1. Send message to group
    `POST /ws/api/v1/hubs/{hub}/groups/{group}`
1. Close a connection
    `DELETE /ws/api/v1/hubs/chat/connections/a?reason=reason`