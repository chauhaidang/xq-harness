# XQ Fitness write-service dependency-audit baseline

Status: **GO after PR #57 merges — approved dependency baseline for curated import**

Issue: [#44, Choose the write-service dependency-audit baseline](https://github.com/chauhaidang/xq-harness/issues/44)

Evidence date: 2026-07-22

This document defines the dependency vulnerability and deprecation gate for the
archived XQ Fitness write service. The corrected, committed audit candidate now
has current production and full-development reports from an authorized GitHub
Actions runner. Issue #44 closes when PR #57 merges the reviewed lock and gate;
issue #46 must not start before that merge.

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

### Authorized target-candidate evidence

| Evidence | Result |
| --- | --- |
| Candidate | `prototypes/xq-fitness-write-service-audit`; private and non-publishable; 6 production and 25 development declarations |
| Committed lock | npm lockfile v3; 728 package entries; SHA-256 `c952d018bba8aa9246037b31f96ef619502faced8b78a61c8e3493d99ed11233` |
| Toolchain and endpoint | Node `v22.23.1`, npm `11.16.0`, `https://registry.npmjs.org/` |
| Final audit | [GitHub Actions run 29933182931](https://github.com/chauhaidang/xq-harness/actions/runs/29933182931), 2026-07-22; production and development each report zero info, low, moderate, high, or critical findings |
| Remediation proof | Initial run 29932789837 found development-only `jest-junit@16.0.0` and transitive `uuid@8.3.2` moderate findings; exact `jest-junit@17.0.0` resolves to fixed `uuid@14` and run 29933001852 returned zero findings before the lock was committed |
| Clean trees | Production and full-development `npm ci --ignore-scripts` and `npm ls --all` passed using GitHub Packages for exact internal releases and npm for public packages |
| Deprecations | Development-only warnings are owned by [#58](https://github.com/chauhaidang/xq-harness/issues/58), target 2026-10-20; no warning has a current advisory or prevents the verified Node 22 build, lint, unit, generated-client, or component gates |
| Exceptions | None |

The archived manifest contained three deterministic-install concerns. The audit
candidate resolves them as follows:

- `@chauhaidang/xq-test-utils@1.0.2` is replaced by exact published
  `@chauhaidang/xq-harness-test-utils@0.1.1` from #41.
- Mutable `ts-node@latest` is replaced by exact `ts-node@10.9.2`.
- `xq-fitness-write-client` is a development-only
  `file:./generated-clients/write-service` dependency. This local edge is
  retained only as a private package stub containing the dependency contract
  deterministically produced by OpenAPI Generator `7.17.0`; issue #49 must
  generate the ignored client before `npm ci` and must not resolve this edge to
  another repository or hand-maintained artifact.

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

The corrected candidate satisfies the dependency gate:

1. The final production and full-development advisory reports are current,
   retained, and bound to the committed lockfile hash above.
2. Both scopes contain zero findings at every severity, so no vulnerability
   exception or security approval is required.
3. The only findings from the first authorized run were remediated by upgrading
   the direct reporter dependency; the intermediate and committed-lock reruns
   both prove the vulnerable `uuid@8.3.2` path is gone.
4. Clean production and development dependency trees pass on the required
   Node/npm line with valid registry provenance and exact internal packages.
5. Development-only deprecations have the named owner, evidence, scope,
   verification, and 90-day removal target recorded in #58. They meet none of
   the immediate blocking conditions in the deprecation policy.

**Import-gate decision:** GO when PR #57 merges. The merge makes the reviewed
candidate lock, zero-undispositioned-finding policy, and evidence contract part
of `main`, at which point #44 may close and #46 becomes the next frontier.
Future lock changes must rerun the same production and development gates; this
decision does not grandfather a later advisory or deprecation.
