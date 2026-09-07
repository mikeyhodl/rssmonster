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

The bundled CLI is an alternative after installing server dependencies:

```bash
# Run from server.
./node_modules/.bin/web-push generate-vapid-keys
```

Use one public/private VAPID pair for the installation. The public key identifies
the application server to browsers; the private key signs outgoing Push
requests. Each browser creates its own endpoint and encryption keys after the
user grants permission. RSSMonster stores that subscription against the signed-in
user and encrypts delivery through the browser's Push service. That service
does not receive the RSSMonster login token or VAPID private key.

Add the generated values without surrounding whitespace to `server/.env` for a
source installation, or to the repository-root `.env` for Docker Compose:

```env
# Optional Web Push notification configuration (VAPID).
VAPID_PUBLIC_KEY=replace-with-the-generated-public-key
VAPID_PRIVATE_KEY=replace-with-the-generated-private-key
VAPID_SUBJECT=mailto:admin@example.com
```

`VAPID_SUBJECT` must identify the operator with a `mailto:` address or an HTTPS
URL, such as `https://rss.example.com`. Keep the key pair stable for the lifetime
of the installation: replacing it can invalidate existing subscriptions. Never
commit the private key or put it in client-side configuration. Unset VAPID values
disable Push without preventing ordinary reading.

Both supplied Compose profiles already pass the variables to the web service.
The dedicated crawl workers also deliver notifications, but their supplied
`environment` blocks do not list VAPID values. For scheduled-crawl notifications,
add the following to `rssmonster-worker.environment` in your deployment override:

```yaml
VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY:-}
VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY:-}
VAPID_SUBJECT: ${VAPID_SUBJECT:-}
```

A root `.env` entry alone does not inject an unlisted variable. Recreate the
containers with `docker compose up -d` using your selected Compose files and
override. For source installations, restart the web and crawl-worker processes
after updating their environment; `cd server && npm start` starts the foreground
web process. See [Configuration]({% link configuration.md %}#where-configuration-lives).

Notifications can arrive when the installed web app is closed, subject to browser
and operating-system delivery behavior. Enable them in the Options sheet as
explained above. If RSSMonster reports Push as unconfigured, check all three
values in the responsible process and restart it. The control can restore a
missing subscription; denied permission must be changed in browser or OS settings.

`GET /api/push/configuration` reports availability and the public key.
`GET`, `POST`, and `DELETE /api/push/subscription` inspect or manage a subscription
with JWT authentication. Failed deliveries with expired/not-found endpoints
remove the stale subscription; other failures are logged. Zero new articles do
not trigger a notification.
