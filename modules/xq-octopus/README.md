# xq-octopus

Agent-friendly REST API testing CLI.

## Local commands

```bash
npm install
npm run build
npm test
npm run format:check
npm run lint
node dist/cli/main.js --help
```

`npm test` includes subprocess E2E tests that start a local HTTP API with
`/health`, `/echo`, and `/openapi.json` endpoints, then call the compiled CLI.

## Config

Copy `xq.json.example` to `xq.json` and choose an environment with `--env`.

```json
{
  "environments": {
    "dev": {
      "apiBaseUrl": "https://api.example.test",
      "apiToken": null,
      "headers": {
        "X-App": "local"
      }
    }
  }
}
```

Config rules:

- `apiBaseUrl` is required.
- `apiToken` is optional and must not be printed in output.
- `headers` is optional.
- Header keys and values must be strings.

## Agent Skill

The release package name stays `xq-octopus` and publishes to the public npm
registry. The package includes `skills/xq-octopus/SKILL.md` so consumers can
install the CLI and copy the skill into their agent workspace:

```bash
npm install --save-dev xq-octopus
node path/to/xq-scripts/scripts/install-skills.js
```

The installer copies `node_modules/xq-octopus/skills/xq-octopus/` into
`.agents/skills/xq-octopus/` when the consumer repo has a `.agents/` or
`.agent/` directory.

Publishing is handled by `.github/workflows/cd-xq-octopus.yml` when
`modules/xq-octopus/package.json` has a version change on `main`. The workflow
uses `NPM_TOKEN`.
