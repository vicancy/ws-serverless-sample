# Introduction
This is a simple chat sample, built upon Azure Function and the Raw WebSocket feature of Azure SignalR Service.

## Run the Chat

### Deploy the Chat
### Set the config
### Set the Upstreams for the Service

```http
GET http://localhost:8080/manage/v1/ws/upstream
```

```json
POST http://localhost:8080/manage/v1/ws/upstream
{
	"templates": [
		{
			
            "urlTemplate": "http://localhost:7071/api/messages?event={event}"
		}
    ]
}
```

There are two Functions inside this repo:
1. [The Function hosting the Chat's static webpage](./chat/serverless/home)
3. [The Function handling WebSocket requests](./chat/serverless/messages)

## The Function hosting the Chat's static webpage
The Chat's webpage is quite simple, a static webpage is enough. It is based on pure html and the [Vue.js](https://cn.vuejs.org/index.html) JavaScript framework. What the function does in [index.js](./chat/serverless/home/index.js) is simply return the content of [index.html](./chat/serverless/home/index.html), providing the Azure SignalR Serverless WebSocket endpoint value `{AzureSignalREndpoint}/ws/client/hubs/chat`. The following patterns are all valid while `{hub}` is required and `{format}` is optional with `text` as default value.

1. `/ws/client?hub={hub}&format={text|binary}`
2. `/ws/client/hubs/{hub}?format={text|binary}`
3. `/ws/client/hubs/{hub}/formats/{text|binary}`

To make the demo workflow simple, current auth info is read from request's query `name`. AAD is also supported if AAD is configured for the Function App.

## Configure the Upstreams for the WebSocket requests

You may've been noticed that no auth info is needed connecting to Azure SignalR Serverless WebSocket. It is the case when the `connect` `UpstreamSettings`
In the demo, we provide a workaround for setting the Upstream URL pattern as providing a claim as `asrs.s.rfh` and read the value from Environment variable `UpstreamUrl`, as for now the portal access is not yet ready. Later on, when Azure SignalR Service adds the ability to set the Upstream Settings from portal, this workaround will be obsoleted.

The Upstream URL pattern has 3 supported parameters, `{event}`, `{hub}`, `{category}`. These 3 parameters will be evaluated and replace dynamically in Azure SignalR for a single client request. For example, when a request `/ws/client/hubs/chat` comes in, with a configured Upstream URL pattern `http://localhost:7071/api/messages?event={event}`, when the client connects, it will first POST to this URL: `http://localhost:7071/api/messages?event=connect`.

|Event  | {event} | {category} |
|-----------| -------------| ----------------|
|Connect | `connect` | `connections` |
|Message | `message` | `messages` |
|Disconnect | `disconnect` | `connections` |

## The Function handling WebSocket requests
Before the WebSocket connection is established, the `connect` event is triggered, providing the Function the ability to Auth the user or reject the user or select the **subprotocol** for the WebSocket connection. The **subprotocol** of the incoming request is set inside the header `Sec-WebSocket-Protocol`. As defined in the WebSocket spec, the header can be set multiple times, and the Function should be responsible for setting the response `Sec-WebSocket-Protocol` header of one selected protocol.

If the `connect` event returns success code, Azure SignalR Service will establish the real WebSocket connection with client. After that, every WebSocket frame triggers a HTTP request to the Upstream URL. The following headers are added by Azure SignalR Service so that the Function can read the info from the request headers:

* `X-ASRS-Hub`: `{hubname}`
* `X-ASRS-Category`: `connections`
* `X-ASRS-Connection-Id`: `{connection-id}`
* `X-ASRS-Event`: `connect`
* `X-ASRS-User-Id`: `{user-id}`
* `X-ASRS-User-Claims`: `{user-claims}`
* `X-ASRS-Signature`: `sha256={connection-id-hash-primary},sha256={connection-id-hash-secondary}`
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
