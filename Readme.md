# Introduction
This is a simple chat sample, built upon Azure Function and the Serverless WebSocket feature of Azure SignalR Service.

- [Prerequisites](#prerequisites)
- [Initialize the function app](#initialize-function-app)
- [Deploy and run function app on Azure](#deploy-to-azure)
- [Enable authentication on Azure](#enable-authentication)
- [Build the sample locally](#build-locally)

## Run the Chat sample locally

### Prerequisites
The following are required to run the Chat sample locally
* [Node.js](https://nodejs.org/en/download/) (Version 10.x, required for JavaScript sample)
* [Visual Studio Code](https://code.visualstudio.com/) as the Function's IDE
* [Azure Functions Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) inside Visual Studio Code
* [ngrok](https://ngrok.com/) to expose local port to public

###  Configure application settings
When running and debugging the Azure Functions runtime locally, application settings are read from **local.settings.json**. Also, you can upload these settings to remote when you try to deploy Function App to Azure. Inside `local.settings.json`, replace the value of `AzureSignalREndpoint` and `AzureSignalRAccessKey` with the value from your ConnectionString of the Azure SignalR, the value of `Endpoint=` and `AccessKey=` respectively.

### Run the Function locally
Open the folder [./chat/serverless] in VS Code, it contains a Function App host config so that with when press F5, the Azure Function extension detects the config and starts to run both `home` and `messages` Http Functions. The `home` Function `http://localhost:7071/api/home` is which to return the hosted web app, and the `messages` Function `http://localhost:7071/api/messages` is the Upstream we expect the Azure SignalR will invoke on every event. So next step is to expose this local port so that Azure SignalR is able to reach it. [ngrok](https://ngrok.com/) helps us to achieve this.

Inside the `ngrok` folder, type:
```
ngrok http 7071
```

From now on, **ngrok** forwards every request to `http://(id).ngrok.io` to `http://localhost:7071`. 

### Set the Upstreams for the Service
Now it is time to config the Upstream URL pattern inside Azure SignalR Service.

With this Private Preview version, we provide a REST API endpoint for you to set and get the Upstream settings of the Service. Please note that, later on, this endpoint will be **removed** when we support setting the Upstream from portal and Azure CLI.

We provide a simple web app https://ws-manage.azurewebsites.net/api/manage deployed for you to easily get and set the current Upstream settings of the service, with source code in this repo [manage](./manage/manage/).

Put following into the Set Upstream text area to set the Upstream settings for the service.
```
{
	"templates": [
		{
            "urlTemplate": "http://(id).ngrok.io/api/messages?event={event}"
		}
    ]
}
```

### Run the chat
Now visit `http://localhost:7071/api/home?name=yourname` and you are ready to chat locally.


## Go through the demo code
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
