---
layout: page
title: Assistant and MCP
parent: Using RSSMonster
nav_order: 15
---

# Assistant and MCP

The optional assistant helps you explore articles already stored in RSSMonster.
Open chat from the desktop toolbar or mobile Options sheet. Try requests such as
“Find unread security articles from this week” or “Summarize this article.”
Responses depend on available source material and the configured model; follow
article links to check details against the source.

## What the assistant can access

Authenticated tools can search articles, fetch selected article content, list feeds
and categories, find tags, and retrieve favorite, clicked, or hot articles. Search
results are bounded and scoped to your account. Content retrieval works on
explicitly selected articles; it does not read your entire archive in one call.
The assistant also has a crawl tool that can request a feed refresh.

The ordinary search field accepts [search expressions]({% link search.md %}), not arbitrary
natural-language instructions. The assistant translates conversational requests
into tool calls. It cannot retrieve articles that RSSMonster has never collected
just by searching your archive.

## Enable the assistant

Configure the inference service and its provider credentials as described in
[Model Usage]({% link model-usage.md %}). On the server, both `INFERENCE_AI_ENABLED=true`
and `INFERENCE_ASSISTANT_ENABLED=true` are required. Restart affected processes
after changing configuration. Docker also needs these values passed through the
appropriate service environment.

Provider credentials belong in inference configuration. RSSMonster executes
user-scoped tools locally; inference performs model calls. When using an external
provider, prompts and the source material included in those requests leave the
RSSMonster host. Embedding and assistant providers can have different settings.

If chat is unavailable, check both enable flags, inference readiness, and provider
configuration. Timeouts and capability circuit breakers are described in
[Configuration]({% link configuration.md %}).

## Integrate using MCP

The Model Context Protocol transport is mounted at `/mcp`, outside `/api`.
It accepts authenticated `GET` and `POST` requests using a JWT bearer token and
exposes the shared RSSMonster tools. `/api/agent` is the built-in assistant endpoint;
there is no `/api/mcp` route. MCP authentication and tools do not themselves
require enabling the built-in assistant's model provider.

A compatible integration must support the transport and bearer authentication;
ordinary RSS clients should use [Fever or Google Reader]({% link api.md %}). See
[RSSMonster API]({% link rssmonster-api.md %}) for login and rate limits. The implementation
in `server/controllers/mcp.js` is the reference for tool names and schemas.
