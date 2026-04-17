# Agents.md — RSSMonster

Concise guide for AI coding agents. For full docs see `README.md` and `.github/copilot-instructions.md`.

## Architecture

Monorepo with two packages:

| Package | Stack | Entry point |
|---------|-------|-------------|
| `client/` | Vue 3, Vite, Bootstrap 5, Pinia | `src/main.js` |
| `server/` | Express 5, Sequelize, MySQL | `bootstrap.js` → `app.js` |

Node.js 20+. Both packages use `"type": "module"` (ESM).

## Quick Commands

```bash
# Server
cd server
npm install
npm run db                # run Sequelize migrations
npm start                 # node bootstrap.js
npm run debug             # node --watch
npm test                  # vitest run
npm run lint              # eslint

# Client
cd client
npm install
npm run dev               # vite dev server
npm run build             # vite build
npm test                  # vitest run
npm run lint              # eslint

# Docker (full stack)
docker-compose up
```

## Do / Don't

### ESM

- **Do** use `import`/`export` everywhere. Server imports must include `.js` extension.
- **Don't** use `require()`. Exception: migration files use CommonJS (`module.exports`).

### Models

- **Do** import via the two-line pattern:
  ```js
  import db from '../models/index.js';
  const { Article, Feed, Category } = db;
  ```
- **Don't** import model files directly — they need Sequelize init from `index.js`.

### Controllers

- **Do** wrap every handler in try/catch. Log with `console.error('Error in fnName:', err)`.
- **Do** check `req.userData.userId` and return 401 if missing.
- **Do** use early returns for validation.
- **Don't** use `_next` unless forwarding errors.

### Routes

- Routes are thin: wire `userMiddleware.isLoggedIn` + controller method.
- Mounted at `/api/*` in `app.js` (except `/mcp`, `/agent`, `/rss`).

### Migrations

- **Do** create new migration files (`YYYYMMDDHHMMSS-description.js`).
- **Don't** modify existing migrations — they're tracked as already-run.
- Use `onUpdate: 'CASCADE'`, `onDelete: 'CASCADE'` for foreign keys.

### Frontend

- **Do** use Vue 3 Options API (`export default { data, methods, computed }`).
- **Don't** use `<script setup>` — the codebase uses Options API consistently.
- **Do** use Bootstrap 5 classes and Bootstrap Icons (`<BootstrapIcon icon="name" />`).
- **Do** provide `@media (prefers-color-scheme: dark)` variants for new styles.
- **Don't** introduce other CSS frameworks.

### API Layer (`client/src/api/`)

- Named exports only, single-expression arrows, no error handling (errors bubble up).
- Shared Axios instance in `client.js` handles auth headers and 401 interception.

### Pinia Stores (`client/src/store/`)

- Options-style `defineStore`. Rename API imports with `API` suffix to avoid collisions.

## Key File Paths

| Purpose | Path |
|---------|------|
| Server entry | `server/bootstrap.js` → `server/app.js` |
| DB config | `server/config/config.cjs` |
| Models | `server/models/` (factory pattern, associations in `index.js`) |
| Controllers | `server/controllers/` |
| Routes | `server/routes/` |
| Migrations | `server/migrations/` |
| Scripts | `server/scripts/crawl.js`, `reclusterArticles.js`, `calculateFeedTrust.js` |
| Vue root | `client/src/App.vue` → `client/src/AppShell.vue` |
| Components | `client/src/components/` (Desktop/, Mobile/, Modal/, Onboarding/) |
| API services | `client/src/api/` |
| Pinia stores | `client/src/store/` |
| Global SCSS | `client/src/assets/scss/global.scss` |
| Vite config | `client/vite.config.js` |

## Testing

- **Framework:** Vitest for both packages
- **Server tests** run against a real database (no Sequelize mocks). Use `supertest` for HTTP tests. `beforeAll` with `app.js` import needs 30s timeout.
- **Client tests** use `jsdom` environment and `@vue/test-utils`.
- Helpers: `server/tests/helpers/resetDb.js` does `sequelize.sync({ force: true })`.

## Naming Conventions

| Entity | Style | Example |
|--------|-------|---------|
| Variables/functions | camelCase | `feedName`, `getArticles` |
| Constants | UPPER_SNAKE | `CRAWL_TIMEOUT_MS` |
| Vue components | PascalCase | `ArticleFeed` |
| Component registration | kebab-prefix | `appArticleFeed` |
| DB tables | plural lowercase | `articles`, `feeds` |
| DB columns | camelCase | `feedId`, `starInd` |
| API functions | verb + noun | `fetchFeeds`, `createFeed` |
| Migrations | timestamp-desc | `20260101000000-create-things.js` |
| Unused params | `_` prefix | `_next`, `_req` |

## Code Style (ESLint)

- `prefer-const`, `arrow-body-style: 'as-needed'`, `object-curly-spacing: 'always'`
- `no-console: off`, `no-unused-vars: warn` (args matching `^_` ignored)
- Use `/* ---- Section ---- */` headers in long files
- Minimal comments — only for non-obvious logic or workarounds

## Common Pitfalls

- **fetch body consumed twice:** Use `response.clone()` before any `.text()`/`.json()`.
- **Cloudflare-protected feeds:** `discoverRssLink` may return `{ cloudflare: true, url }` instead of a string.
- **Sequelize operators:** Import `{ Op } from 'sequelize'` explicitly.
- **Express 5:** Some Express 4 patterns (route param callbacks) don't work.
- **Quality scores:** `NEUTRAL_SCORE = 70`. Displayed quality is a weighted blend: `sentimentScore × 0.5 + qualityScore × 0.35 + advertisementScore × 0.15`.
- **PWA:** Test changes to static assets/service worker in both install and update flows.
- **`DISABLE_LISTENER` env var:** Suppresses HTTP listener in tests.
