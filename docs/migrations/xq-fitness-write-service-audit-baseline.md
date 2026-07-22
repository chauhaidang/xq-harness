# XQ Fitness write-service dependency-audit baseline

Status: **STOP — not approved for import acceptance**

Issue: [#44, Choose the write-service dependency-audit baseline](https://github.com/chauhaidang/xq-harness/issues/44)

Evidence date: 2026-07-22

This document defines the dependency vulnerability and deprecation gate for the
archived XQ Fitness write service. It does not approve a vulnerability by
absence of evidence. Import acceptance remains blocked until the target
monorepo lockfile has current production and full-development audit reports and
every reported item has the disposition required below.

## Evidence inspected

The source was read directly from
`xq-fitness-backend-source-2026-07-20.tar.gz`; it was not extracted into the
repository.

| Evidence | Result |
| --- | --- |
| Archive SHA-256 | `1994859408762f3e188dc466fb31ee05b1c8b63cf0a4f1a88a8e849a97e26a38`, matching the migration specification |
| Archived manifest | `write-service/package.json`, version `2.1.0`, lockfile v3, package manager `npm@11.16.0` |
| Inspection toolchain | Local structural inspection used Node `v26.3.1` and npm `11.16.0`; this is not the required Node 22 acceptance run |
| Direct production dependencies | 6: `cors`, `dotenv`, `express`, `joi`, `pg`, and `pg-pool` |
| Direct development dependencies | 25, including build, lint, test, generated-client, and internal harness tooling |
| Locked package entries | 630 total; 102 production-or-mixed entries and 528 development-only entries according to lockfile `dev` markers |
| Archived deprecation metadata | No package entry contains a `deprecated` field. This is not proof that the registry currently reports no deprecations. |
| Install scripts | One development-only entry, `unrs-resolver@1.12.2`, declares an install script |
| Lock provenance | 601 entries lack both `resolved` and `integrity`; all six direct runtime entries are in that set. The local generated-client entry is also intentionally non-registry. |

The archived manifest also contains three deterministic-install concerns that
must be corrected or explicitly proven by the onboarding work:

- `@chauhaidang/xq-test-utils@1.0.2` is the old internal package name. The
  migration contract requires the exact published
  `@chauhaidang/xq-harness-test-utils` release from #41.
- `ts-node` is declared as `latest`. Although the archived lock currently
  selects `10.9.2`, a lock refresh is not bounded by the manifest.
- `xq-fitness-write-client` is a development-only
  `file:./generated-clients/write-service` dependency. This local edge is
  acceptable only for the ignored, unpublished generated client when the clean
  checkout bootstrap deterministically creates it before `npm ci`. It must not
  resolve to another repository or a hand-maintained artifact.

The standalone `.npmrc` was not imported or displayed. Its key names confirm
that it contains package-registry authentication configuration, so it remains
excluded under the migration specification.

## Risk model and classification

Audit results must be generated twice from the same committed target lockfile:

1. **Production:** `npm audit --omit=dev`. A finding is production-scoped when
   any installed path remains in `npm ci --omit=dev`, even if another path also
   appears in development tooling.
2. **Development:** full `npm audit`. A finding present only outside the
   production tree is development-scoped. Development does not mean harmless:
   compilers, test runners, generators, linters, CLIs, and install scripts
   execute in CI and may process pull-request-controlled content.

When npm reports the same advisory on several paths, disposition the advisory
once but record every production path and each materially different development
execution path. Classification is based on the installed path and execution
context, not whether the vulnerable package is a direct dependency.

### Severity and import policy

| Scope and severity | Default disposition | Exception limit |
| --- | --- | --- |
| Production critical or high | Must remediate before import acceptance. Upgrade, remove, or replace and rerun all service gates. | No baseline exception. |
| Production moderate | Remediate before import unless exploitability is disproved for every production path and compensating controls are reviewed. | Security-approved exception, maximum 30 days. |
| Production low | Fix when a compatible remediation exists; otherwise record reachability and ownership. | Owner-approved exception, maximum 90 days. |
| Development critical or high | Must remediate when the package executes in install, build, generation, lint, test, packaging, or CI, or processes untrusted input. | Maximum 30 days only when a security reviewer proves the vulnerable behavior is not executed and no production artifact is affected. |
| Development moderate | Remediate or record an owned upgrade/removal plan. | Maximum 90 days. |
| Development low | Track when reachable; may be accepted temporarily. | Maximum 180 days. |
| Informational | Does not block by severity alone, but must be recorded if it changes install provenance, package support, or runtime exposure. | Review at the next lock refresh. |

An npm severity label is the starting point. The reviewer may raise, but must
not silently lower, the effective severity for internet-facing request parsing,
SQL/database access, arbitrary-code execution, credential exposure, install
scripts, or code generation. A disputed upstream rating stays blocking until a
security reviewer records the effective severity and evidence.

### Deprecation policy

Deprecation is assessed separately from vulnerabilities.

- A deprecated or end-of-life direct production package blocks import until it
  is replaced, upgraded to supported lineage, or receives a security-approved
  30-day exception.
- A deprecated transitive production package requires its introduction path,
  upstream replacement/upgrade, support status, and removal owner. It blocks
  when unsupported code is internet-facing, handles credentials/data, or has no
  maintained remediation path.
- A deprecated build/test package requires an owned replacement plan. It blocks
  immediately when it prevents Node 22/npm 11 operation, emits an unsupported
  runtime artifact, or is abandoned with a known high/critical issue; otherwise
  its exception may last at most 90 days.
- Registry deprecation warnings and lockfile `deprecated` fields are retained
  as sanitized evidence. “No lockfile field” is not accepted as a current
  registry check.

## Exception record schema

Every exception must be a reviewable issue or checked-in structured record with
all fields below. Free-form “accepted risk” comments are insufficient.

| Field | Required content |
| --- | --- |
| `exception_id` | Stable identifier linked to its tracking issue |
| `advisory` | GHSA/CVE/npm advisory identifier and authoritative URL |
| `package` / `installed_version` | Exact affected package and locked version |
| `scope` | `production` or `development` |
| `paths` | All relevant `npm explain` dependency paths |
| `reported_severity` / `effective_severity` | Upstream rating and any security-reviewed increase |
| `reachability` | Concrete executed entry point, or evidence that vulnerable behavior is unreachable |
| `impact` | Confidentiality, integrity, availability, build, or supply-chain consequence |
| `remediation` | Fixed version or removal/replacement plan and blocking dependency |
| `compensating_controls` | Existing, testable controls; planned controls do not count |
| `owner` | Named GitHub user or accountable team, not a generic role |
| `security_reviewer` | Named approver for production moderate or development high/critical |
| `approved_on` / `expires_on` | ISO-8601 dates; expiry must respect the table above |
| `verification` | Exact commands and sanitized evidence demonstrating the disposition |
| `closure_condition` | Observable condition that removes the exception |

Expired, ownerless, incomplete, severity-suppressed, wildcard, or
automatically-renewed exceptions fail CI and block import. Renewal is a new
review using a fresh advisory snapshot; it is never an edit that merely moves
the date.

## Required verification

Run these commands in an isolated temporary directory or the curated target
module on Node 22 with npm 11.16.0. Do not use or copy the archived `.npmrc`;
registry authentication must come from scoped user/CI configuration.

```bash
node --version
npm --version

npm audit --package-lock-only --omit=dev --audit-level=moderate
npm audit --package-lock-only --audit-level=high

npm ls --omit=dev --all
npm ls --all
```

The two human-readable audit commands are the minimum CI gates. Also retain
sanitized JSON from the same run for classification and exception matching:

```bash
set +e
npm audit --package-lock-only --omit=dev --json > audit-production.json
AUDIT_PRODUCTION_STATUS=$?
npm audit --package-lock-only --json > audit-development.json
AUDIT_DEVELOPMENT_STATUS=$?
set -e

test "$AUDIT_PRODUCTION_STATUS" -eq 0
test "$AUDIT_DEVELOPMENT_STATUS" -eq 0
```

Those final two assertions apply when no approved exceptions exist. If an
exception exists, a deterministic policy checker must validate advisory ID,
scope, installed version/path, owner, reviewer, and expiry before returning
success. Filtering text output or using `npm audit --force` is forbidden.

For each finding, record paths and confirm the post-remediation tree:

```bash
npm explain <affected-package>
npm ci --omit=dev --ignore-scripts
npm ls --omit=dev --all
npm ci --ignore-scripts
npm ls --all
```

The onboarding clean-install and component gates must separately run the
approved lifecycle scripts; `--ignore-scripts` above isolates dependency-tree
and advisory inspection and is not a substitute for build/test verification.
The single development install script must be reviewed before scripts are
enabled.

For deprecation and lock provenance, inspect the committed lock without network
credentials:

```bash
node -e '
const lock = require("./package-lock.json");
for (const [path, metadata] of Object.entries(lock.packages || {})) {
  if (metadata.deprecated) console.log(path, metadata.version, metadata.deprecated);
}
'

git diff --check
```

Acceptance evidence must record the target commit and lockfile SHA-256, Node/npm
versions, audit timestamp, npm advisory endpoint, production and development
counts by severity, remediation commit or exception ID for every finding, and
the clean install/build/unit/contract/component results. Reports must contain no
tokens, registry configuration, environment values, URLs with credentials, or
production response data.

## Current disposition

The archive cannot receive an approved audit baseline yet:

1. A current npm advisory response was not obtained. The user explicitly
   authorized the query on 2026-07-22, but the execution environment still
   rejected transmission of the private archived dependency graph to npm's
   external advisory service. The required commands must run in an authorized
   CI environment or be run manually, with sanitized results attached to #44.
2. Consequently there is no evidence-backed list of current production or
   development vulnerabilities and no finding can be declared fixed or
   excepted.
3. The old internal test-utils name, mutable `ts-node` declaration, generated
   local-client bootstrap, and missing registry integrity metadata require
   resolution or deterministic clean-install evidence in the curated target
   lockfile.
4. The archive contains no approved exception records.

**Import-blocking decision:** keep #44 open and stop #46/import acceptance until
the corrected target manifest and lockfile pass the required Node 22/npm 11
production and full audits, deprecation review, clean installs, and exception
validation. Zero production high/critical findings is mandatory. Any remaining
production moderate or development high/critical finding needs the bounded
exception evidence above; lower-severity findings need owners and expiry where
required. Record the final counts, lockfile hash, and approved disposition in
#44 before declaring the prerequisite closed.
