---
layout: page
title: Web App and Notifications
parent: Using RSSMonster
nav_order: 16
---

# Web App and Notifications

RSSMonster can be installed as a Progressive Web App (PWA). Use the browser's
install or Add to Home Screen action when available, then launch it from your
app launcher. Installation availability depends on the browser and device.
Serve your instance over HTTPS for browser installation and Push capabilities;
localhost is also suitable for local development.

Installation does not download your entire archive for offline reading. The
service worker caches application assets; fetching articles and saving reading
state still require access to the RSSMonster server.

## Enable notifications

Open the mobile or compact-layout **Options** sheet and select **Enable
notifications**, then allow the browser permission request. On iOS/iPadOS, open
RSSMonster from its Home Screen installation before enabling notifications.
Opening the Options sheet alone does not request permission.

Notifications report newly arrived articles and can update the unread badge on
supported platforms. Select **Disable notifications** to remove this browser's
subscription. If permission was denied, change it in browser or operating-system
settings. A temporary configuration-check failure offers a retry.

Push subscriptions belong to the current user and browser/device. Delivery uses
the browser vendor's Push service; it is separate from SMTP and
[briefing emails]({% link account.md %}).

## Configure Web Push on the server

All three values must be present in the processes sending Push notifications:

| Variable | Purpose |
| --- | --- |
| `VAPID_PUBLIC_KEY` | Public application-server key supplied to browsers. |
| `VAPID_PRIVATE_KEY` | Matching private key; keep it secret and stable. |
| `VAPID_SUBJECT` | Contact URI, such as `mailto:admin@example.com`. |

Generate a key pair with the server's existing dependency, from `server`:

```bash
node --input-type=module -e "import webpush from 'web-push'; console.log(webpush.generateVAPIDKeys())"
```

Store the result securely in your environment configuration. For Docker, explicitly
pass the variables into the web and crawl-worker services; a root `.env` entry
alone does not inject an unlisted variable. Restart affected processes. A changed
key pair can require browsers to subscribe again.

`GET /api/push/configuration` reports availability and the public key.
`GET`, `POST`, and `DELETE /api/push/subscription` inspect or manage a subscription
with JWT authentication. Failed deliveries with expired/not-found endpoints
remove the stale subscription; other failures are logged. Zero new articles do
not trigger a notification.
