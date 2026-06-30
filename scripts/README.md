# Scripts

Repository helper scripts.

## Module runner

`scripts/module` lists modules and runs each module's install, build, test, and
CI commands from `modules.yaml`.

```bash
./scripts/module list
./scripts/module ci xq-common-kit
```

## Registry validation

`scripts/check-module-deps.js` ensures `modules.yaml` `depends_on` matches
`portal:` sibling links in `package.json`.

```bash
node scripts/check-module-deps.js
```

See [docs/modules/contributor-map.md](../docs/modules/contributor-map.md).
