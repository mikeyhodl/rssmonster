---
layout: page
title: Contributing
nav_order: 9
---

# Contributing to RSSMonster

Bug reports, documentation improvements, tests, and focused feature changes are
welcome. Use [GitHub issues](https://github.com/pietheinstrengholt/rssmonster/issues)
to describe a reproducible problem or discuss a substantial feature before
starting a large change. Include the deployment profile, relevant version,
expected behavior, and actual behavior. Remove credentials and private article
data from logs or screenshots. Follow [the security policy](https://github.com/pietheinstrengholt/rssmonster/security/policy) for security reports.

## Set up a development environment

Use Node.js **22.19.0 or higher**, npm, and Git. Follow
[Manual Installation]({% link getting-started.md %}#manual-installation) for dependency
installation, environment files, database setup, and local client/server URLs.
Use a separate development database. Inference is optional for core reader work;
[Model Usage]({% link model-usage.md %}) explains local and external providers.

Run the client and server with `npm run dev` in separate terminals, from
`client` and `server` respectively. The client normally uses
`http://localhost:8080`; the server uses `http://localhost:3000`. If the work needs
inference, run `npm run dev` from `inference` and wait for `/ready` to succeed.
Development inference logs show model readiness and content-safe activity across
embeddings, summaries, tags, scoring, assistant requests, Smart Folder
recommendations, and feed rediscovery.

To debug the server, run this from `server` instead of its ordinary dev command:

```bash
npm run debug
```

Node exposes its inspector on port `9229`. For one-off crawling, use the
[documented crawl command]({% link server-jobs.md %}#database-and-crawl-commands).
Background summaries, scores, and inferred tags require the separate AI worker;
see [worker architecture]({% link how-rssmonster-works.md %}#worker-and-pipeline-architecture)
and [process commands]({% link server-jobs.md %}#application-processes).

## Make and validate a change

Fork the repository, create a focused branch, and follow the existing Vue 3,
Express 5, Sequelize, and JavaScript ESM patterns. Read the relevant code,
callers, and tests first. Preserve user ownership checks and the distinctions
between identity, revisions, duplicates, and semantic grouping. Keep unrelated
refactoring out of the change.

Add regression coverage for behavior changes where an established test pattern
exists. Start with focused tests, then run the relevant package checks. Each
block below starts from the repository root:

```bash
cd client
npm test
npm run lint
npm run build
```

```bash
cd server
npm test
npm run lint
```

```bash
cd inference
npm test
npm run lint
```

Server integration tests need an isolated test database and matching test
configuration; consult `.github/workflows/ci.yml` for MySQL and SQLite setup.
Do not point tests, migrations, seeds, semantic rebuilds, or fixture generators
at a production database. The [npm command reference]({% link npm-commands.md %})
describes focused test filters, semantic fixtures, and commands that change data.

CI runs separate server/MySQL, server/SQLite, inference, and client jobs. The
inference job also validates both Compose configurations and builds its Docker
image. Documentation uses the Jekyll build in
`.github/workflows/pages.yml`. With the existing Ruby/Bundler
dependencies installed, run `bundle exec jekyll build` from `docs`. Check relative
links, images, and heading anchors when changing Markdown.

## Submit a pull request

Review `git diff` and `git status`, commit the intended files, push your branch
to your fork, and open a pull request. Explain the problem, resulting behavior,
and validation performed, including any check you could not run. Keep secrets,
local environment files, model caches, and private test data out of commits.
Update the relevant documentation when behavior or setup changes.
