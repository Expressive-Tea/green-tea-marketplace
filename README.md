# green-tea-marketplace

The plugin listing for [green-tea](https://github.com/Expressive-Tea/green-tea), served at
<https://green-tea.expressive-tea.io/plugins>.

One YAML file per plugin under `src/content/plugins/`. Versions and runtimes are **not** stored
here — they are read from npm and JSR when the site is built, so a card cannot go stale or claim
support a package never declared.

```yaml
npm: "@green-tea/jwt"          # at least one of npm / jsr
jsr: "@green-tea/jwt"
repo: https://github.com/Expressive-Tea/green-tea-plugins
description: "One sentence, 20–200 characters."
```

Naming is enforced by the content collection's schema, so a wrongly-named entry fails the build:

| | npm | JSR |
|---|---|---|
| Internal | `@green-tea/<x>` | `@green-tea/<x>` |
| Third party | `green-tea-<x>` or `@scope/green-tea-<x>` | `@scope/green-tea-<x>` |

## Commands

```bash
npm run dev       # http://localhost:4321/plugins
npm run build     # static output in dist/
npm test          # the deploy script's self-test; no network
npm run deploy    # build, then upload — see below
```

## Live data, and why a local build still works

`scripts/registry.mjs` reads npm and JSR at build time.

- **With `CI=true`** — a registry that does not answer **fails the build**. A listing that silently
  drops a plugin, or shows last month's version, is worse than no deploy.
- **Locally** — an unpublished package falls back to `scripts/preview.mjs` and logs a line saying
  so, because a site nobody can look at until its packages ship is a site nobody can design.

`scripts/preview.mjs` is temporary. **Delete it, and its import in `src/pages/index.astro`, once
`@green-tea/jwt`, `@green-tea/metrics` and `@green-tea/rate-limit` are published.**

## Deploy

By hand, from a maintainer's machine. The key authenticates as the whole cPanel account, so it is
never a CI secret.

```bash
DEPLOY_REMOTE=green-tea.expressive-tea.io/plugins \
DEPLOY_HOST=user@host \
npm run deploy
```

`npm run deploy -- --dry-run` prints the SFTP batch without sending anything.

Two things that account forces, which no error message will explain:

- **Uploads never delete.** That docroot holds `.well-known/acme-challenge`; a blind delete takes
  the certificate renewal with it. Old hashed assets simply accumulate.
- **`.htaccess` never travels from `dist/`.** The one on the server carries cPanel's generated PHP
  handler block, which is not in this repository.

**Before the first deploy**, create the directory by hand — `deploy.mjs` starts with `cd` and fails
if the target does not exist:

```bash
sftp -i ~/.ssh/expressive-tea-cpanel user@host
sftp> cd green-tea.expressive-tea.io
sftp> mkdir plugins
sftp> bye
```

Cadence: **Friday**, when something merged that week.

## Not here yet

CI (`validate.mjs` and the GitHub Actions workflow that runs the registry checks on every pull
request) lands after the initial deploy.
