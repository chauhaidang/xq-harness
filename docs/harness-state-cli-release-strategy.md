# Harness State CLI Release Plan and Strategy

## Purpose

Define how the `harness-state` CLI and its companion agent skills are versioned, validated, built, distributed, and supported.

The release outcome has two consumer-facing artifacts:

```bash
harness-state
```

and:

```txt
harness-state-skills-<version>.tar.gz
```

Consumers should not need to know the Python source layout or run internal module paths.

## Release Principles

### 1. The executable command is the product

The stable consumer interface is:

```bash
harness-state <command>
```

Not:

```bash
python -m harness_state <command>
```

Not:

```bash
python path/to/script.py <command>
```

The release is only valid if the built package installs an executable named `harness-state`.

### 2. Agent skills are part of the release contract

The release must also include agent skill files from:

```txt
modules/harness-state/skills/
```

These skills are not runtime database state. They are agent-facing instructions that explain how to use and extend the harness-state tool.

The skill bundle should be released as:

```txt
harness-state-skills-<version>.tar.gz
```

Do not hide the skills only inside the Python wheel. Agents and users should be able to inspect, install, or vendor the skill files directly from the GitHub Release.

### 3. Release artifacts must be reproducible

The release process should produce standard Python artifacts:

```txt
dist/
  xq_harness_state-<version>-py3-none-any.whl
  xq_harness_state-<version>.tar.gz
  harness-state-skills-<version>.tar.gz
```

The same source commit and version should produce the same package contents.

### 4. SQLite is not part of the release artifact

The package ships code only.

It must not ship:

- `.harness/state.db`
- `.harness/state.db-wal`
- `.harness/state.db-shm`
- local `.harness/artifacts/`
- generated local runtime data

The CLI creates runtime state when consumers run:

```bash
harness-state init
```

### 5. JSONL and Markdown are project data, not package internals

The package knows how to write:

- `.harness/events/*.jsonl`
- `docs/context/*.md`

But those files belong to the consumer repository. They are not bundled inside the Python package.

### 6. Rebuild support is release-critical

The CLI claims SQLite is rebuildable local state. Therefore every release must validate:

```bash
harness-state rebuild
```

If rebuild is broken, the release is invalid.

## Target Release Level

Aim for **Level 3 only**.

That means v1 should not stop at local source usage or internal artifacts. The release should produce a consumer-installable distribution hosted through GitHub.

Important constraint: GitHub Packages currently does not provide a Python/PyPI package registry.

Therefore, the GitHub-targeted Level 3 strategy is:

1. publish the Python wheel/sdist to **GitHub Releases**
2. publish the agent skill bundle to **GitHub Releases**
3. install the CLI from the pinned GitHub Release wheel URL with `uv`
4. install or vendor skills from the pinned GitHub Release skill bundle
5. do not claim `uv pip install xq-harness-state --index-url <github-packages>` support unless GitHub adds a Python registry or the project uses another PyPI-compatible registry

## Level 3: GitHub Releases for Python Package and Agent Skills

This is the v1 target.

Audience:

- engineers consuming the CLI from GitHub
- automation that installs a pinned wheel URL
- agents that need a reproducible released CLI
- agents that need the released harness-state skill instructions

Build method:

```bash
cd modules/harness-state
uv sync
uv run pytest
uv build
```

Expected artifacts:

```txt
modules/harness-state/dist/
  xq_harness_state-0.1.0-py3-none-any.whl
  xq_harness_state-0.1.0.tar.gz
  harness-state-skills-0.1.0.tar.gz
```

Release location:

```txt
https://github.com/<OWNER>/<REPO>/releases/tag/harness-state-v0.1.0
```

Release assets:

```txt
xq_harness_state-0.1.0-py3-none-any.whl
xq_harness_state-0.1.0.tar.gz
harness-state-skills-0.1.0.tar.gz
SHA256SUMS
```

Consumer install from GitHub Release wheel:

```bash
uv tool install https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
```

Alternative install into the current environment:

```bash
uv pip install https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
```

Why this is the primary Python path:

- it preserves the Python wheel/sdist format
- it works with `uv`
- it is hosted on GitHub
- it avoids pretending GitHub Packages is a PyPI registry
- it gives deterministic versioned release URLs

Agent skill install from GitHub Release:

```bash
curl -L \
  https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/harness-state-skills-0.1.0.tar.gz \
  -o /tmp/harness-state-skills-0.1.0.tar.gz
mkdir -p .agents/skills
tar -xzf /tmp/harness-state-skills-0.1.0.tar.gz -C .agents/skills
```

Expected installed shape:

```txt
.agents/
  skills/
    harness-state/
      SKILL.md
      ...
```

If the released bundle contains multiple skills, install shape should be:

```txt
.agents/
  skills/
    harness-state/
      SKILL.md
    harness-state-release/
      SKILL.md
```

## Versioning Strategy

Use semantic versioning:

```txt
MAJOR.MINOR.PATCH
```

Initial development version:

```txt
0.1.0
```

Patch version:

- bug fixes
- packaging fixes
- docs fixes
- no intentional CLI behavior change
- no event schema change

Examples:

```txt
0.1.1
0.1.2
```

Minor version:

- new CLI commands
- new event types
- new export formats
- backward-compatible schema additions

Examples:

```txt
0.2.0  add requirement update
0.3.0  add harness-state run -- <command>
0.4.0  add entity links
```

Major version:

- stable production contract
- breaking CLI changes
- breaking event schema changes
- required migration behavior

Example:

```txt
1.0.0
```

## Compatibility Strategy

The CLI has three compatibility surfaces:

1. command interface
2. event JSONL format
3. SQLite schema

### Command compatibility

Avoid renaming commands once released.

Prefer adding new commands over changing existing commands.

Good:

```bash
harness-state requirement update REQ-1234ABCD --body "..."
```

Risky:

```bash
harness-state requirement edit ...
```

if `update` already exists.

### Event compatibility

Event JSONL is the durable machine-readable timeline. Be conservative with it.

Rules:

- do not remove existing fields from event records
- do not change existing event meanings silently
- add optional fields instead of changing required fields
- support reading older event shapes during rebuild

Example safe change:

```json
{
  "event_type": "requirement.created",
  "payload": {
    "title": "A",
    "body": "B",
    "source": "user",
    "status": "active",
    "tags": ["agent-context"]
  }
}
```

Example unsafe change:

```json
{
  "event_type": "requirement.created",
  "payload": {
    "name": "A"
  }
}
```

if older code expects `title`.

### SQLite compatibility

SQLite is local state and rebuildable, so compatibility pressure is lower.

However, user data loss is still unacceptable.

Rules:

- schema changes should be additive before `1.0`
- if a breaking schema change is required, support `harness-state rebuild`
- after `1.0`, add migrations instead of relying only on rebuild

## Release Branch and Tag Strategy

For v1, use tags from the main branch.

Tag format:

```txt
harness-state-v0.1.0
```

Why prefix the tag:

- this is a monorepo
- other modules may have their own versions
- `harness-state-v*` clearly scopes the release

Release flow:

```bash
git checkout main
git pull
cd modules/harness-state
uv sync
uv run pytest
SOURCE_DATE_EPOCH=0 uv build
test -d skills
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
tar -czf dist/harness-state-skills-0.1.0.tar.gz -C skills .
cd ../..
git tag harness-state-v0.1.0
git push origin harness-state-v0.1.0
```

Only tag after tests, package build, and skill bundle validation pass.

The GitHub workflow validates the tag after it is pushed. It can prevent an
invalid GitHub Release, but it cannot prevent the git tag itself from existing.
For that reason, the local release flow above is the pre-tag gate.

## CI Release Workflow Strategy

Add a workflow later:

```txt
.github/workflows/harness-state-release.yml
```

Trigger:

```yaml
on:
  push:
    tags:
      - "harness-state-v*"
```

Workflow responsibilities:

1. checkout repo
2. install Python 3.14
3. install `uv`
4. run tests
5. build package
6. verify wheel installation
7. validate skill files under `modules/harness-state/skills/`
8. build `harness-state-skills-<version>.tar.gz`
9. generate `SHA256SUMS`
10. create a GitHub Release for the tag
11. upload wheel, sdist, skill bundle, and `SHA256SUMS` to the GitHub Release

Required workflow permissions:

```yaml
permissions:
  contents: write
```

Suggested validation commands inside CI:

```bash
cd modules/harness-state
uv sync
uv run pytest
uv run harness-state --help
uv run harness-state --version
SOURCE_DATE_EPOCH=0 uv build
uv tool install --force dist/*.whl
harness-state --help
harness-state --version
test -d skills
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
tar -czf dist/harness-state-skills-0.1.0.tar.gz -C skills .
```

Skill bundle validation rules:

- `modules/harness-state/skills/` must exist.
- Each skill must live in its own directory.
- Each skill directory must include `SKILL.md`.
- Each `SKILL.md` must include a frontmatter `name`.
- Each `SKILL.md` must include a frontmatter `description`.
- Skill names should be stable once released.
- Skill instructions should invoke `harness-state`, not internal Python paths.
- Skill instructions should not include absolute local paths from the development machine.

## Pre-Release Validation Checklist

Run these before tagging:

```bash
cd modules/harness-state
uv sync
uv run pytest
uv run harness-state --help
uv run harness-state --version
SOURCE_DATE_EPOCH=0 uv build
```

Then validate the skill bundle:

```bash
test -d skills
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
tar -czf dist/harness-state-skills-0.1.0.tar.gz -C skills .
tar -tzf dist/harness-state-skills-0.1.0.tar.gz
```

Then test the built package:

```bash
uv tool install --force dist/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
harness-state --version
```

Then run a smoke test in a temporary repo:

```bash
mkdir -p /tmp/harness-state-smoke
cd /tmp/harness-state-smoke
git init
harness-state init
harness-state requirement add "Smoke requirement" --body "Verify released CLI works."
harness-state decision record "Smoke decision" --body "Built wheel is executable." --rationale "Release validation."
harness-state timeline
harness-state export
harness-state rebuild
```

Validate:

```txt
.harness/state.db exists
.harness/events/*.jsonl exists
docs/context/*.md exists
harness-state timeline shows ordered events
harness-state rebuild succeeds
```

Then test skill bundle extraction:

```bash
mkdir -p /tmp/harness-state-skills-smoke/.agents/skills
tar -xzf modules/harness-state/dist/harness-state-skills-0.1.0.tar.gz \
  -C /tmp/harness-state-skills-smoke/.agents/skills
find /tmp/harness-state-skills-smoke/.agents/skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

## Release Notes Strategy

Every release should include release notes.

Template:

```md
# xq-harness-state 0.1.0

## Added

- Installable `harness-state` executable.
- Local SQLite state database.
- Append-only JSONL event journal.
- Requirement, decision, spec, solution, task, and workspace events.
- Markdown export under `docs/context`.
- Rebuild from JSONL events.
- Agent skill bundle from `modules/harness-state/skills`.

## Changed

- None.

## Fixed

- None.

## Compatibility

- Requires Python 3.14 or newer.
- Uses `uv` for development/build flow.
- Event JSONL format starts at v1 shape.

## Validation

- `uv run pytest`
- `uv build`
- installed wheel and verified `harness-state --help`
- created and extracted `harness-state-skills-0.1.0.tar.gz`
- smoke-tested `init`, `requirement add`, `decision record`, `timeline`, `export`, and `rebuild`
```

## Consumer Installation Strategy

For v1, document these supported install paths.

### From GitHub Release wheel

```bash
uv tool install https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
```

### Into current environment from GitHub Release wheel

```bash
uv pip install https://github.com/<OWNER>/<REPO>/releases/download/harness-state-v0.1.0/xq_harness_state-0.1.0-py3-none-any.whl
harness-state --help
```

### From source for contributors only

```bash
cd modules/harness-state
uv sync
uv run harness-state --help
```

Do not document unsupported install methods until they are tested.

## Runtime State Strategy

The released package must not assume it is running inside the original monorepo.

When a consumer runs:

```bash
harness-state init
```

the CLI should create runtime state in the current project:

```txt
.harness/
docs/context/
```

The package should detect the current Git repo root. If no Git repo exists, it should use the current directory.

## Security and Safety Strategy

For v1:

- do not execute arbitrary commands as part of release validation except explicit smoke-test commands
- do not upload `.harness/state.db`
- do not upload `.harness/artifacts/` by default
- do not include local event data in package artifacts
- do not claim GitHub Packages PyPI support
- publish Python artifacts through GitHub Releases

For future command wrapping, treat captured command output as potentially sensitive.

## Support Strategy

Before `1.0`, support is best-effort and focused on:

- install failures
- broken executable entry point
- event recording bugs
- rebuild failures
- data loss risks

After `1.0`, support should include:

- documented migration policy
- backward-compatible JSONL readers
- schema migrations
- deprecation policy for CLI commands

## V1 Release Definition of Done

The first release is ready when:

- `pyproject.toml` defines Python `>=3.14`
- `pyproject.toml` defines the `harness-state` console script
- `uv sync` works
- `uv run pytest` passes
- `uv build` creates wheel and sdist
- built wheel installs successfully
- installed wheel exposes `harness-state`
- smoke test passes in a clean temporary Git repo
- release notes exist
- tag `harness-state-v0.1.0` exists
- release artifacts are attached to GitHub Release
- GitHub Release includes `SHA256SUMS`

## Recommended V1 Strategy

Do this in order:

1. finish the CLI implementation
2. validate locally with `uv run harness-state`
3. build wheel/sdist with `uv build`
4. install the wheel with `uv tool install`
5. smoke-test in a temporary Git repo
6. tag `harness-state-v0.1.0`
7. create the GitHub Release with wheel/sdist/checksums

This makes v1 a real Level 3 GitHub-hosted release while respecting the Python packaging constraint: wheels, sdist, and the agent skill bundle go to GitHub Releases.
