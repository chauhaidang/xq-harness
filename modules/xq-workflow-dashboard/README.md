# XQ Workflow Dashboard

Local, read-only dashboard for the operational health and recent history of
runnable `xq-harness` workflows.

## Prerequisites

- Node.js 22 or newer
- npm 11
- GitHub CLI authenticated with `gh auth login`

## Run the live dashboard

Authenticate the GitHub CLI, then start the local service:

```bash
gh auth status
cd modules/xq-workflow-dashboard
npm run dashboard
```

Open <http://127.0.0.1:4173>. The server loads the latest 20 runs per workflow,
then reconciles active workflows and polls the repository-wide runs endpoint
every 30 seconds before streaming new snapshots to the page. Override the defaults with `DASHBOARD_PORT` and
`DASHBOARD_POLL_MS`; polling is clamped to a minimum of five seconds.

Use **Reload data** in the header to trigger the same server-side refresh immediately.

Authentication remains inside the installed `gh` CLI. The server does not read,
accept, persist, log, or send a token to the browser.

## Local verification

```bash
./scripts/module ci xq-workflow-dashboard
```

Run this command from the repository root. The module is local tooling and is
not published or consumed as a package.

`npm run build` copies the static assets to `dist/`. `npm run collect` is an
optional one-shot export using the same local `gh` authentication.

To export a snapshot manually:

```bash
npm run collect
```

The collector monitors active top-level workflow files matching `ci-*`, `cd-*`,
or `*-release`. Reusable `module-*` workflows are excluded. GitHub Pages is not
used, and there is no dashboard deployment workflow.
