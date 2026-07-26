# xq-skills

Distributable agent skills for XQ harness modules.

This package exists so consumers can install one package and run
`install-skills.js` to copy XQ skill Markdown into their project agent
directory.

## Install

```bash
npm install --save-dev @chauhaidang/xq-skills
node path/to/xq-scripts/scripts/install-skills.js
```

The installer copies directories from:

```text
node_modules/@chauhaidang/xq-skills/skills/<skill-name>/
```

into `.agents/skills/<skill-name>/` or `.agent/skills/<skill-name>/` when the
consumer project has opted into one of those agent directories.

## Included Skills

- `e2e-app`
- `e2e-config`
- `e2e-screen`
- `xq-kraken`
