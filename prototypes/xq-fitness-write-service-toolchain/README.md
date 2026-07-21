# PROTOTYPE — XQ Fitness write-service toolchain

This throwaway prototype answers one question:

> What is the smallest toolchain contract that lets the archived
> `xq-fitness-write-service` run under the monorepo's Node 22/npm 11
> conventions without checking in generated clients or sharing local package
> dependencies in the eventual production module?

It is evidence for the Wayfinder decision ticket, not production source. The
runner extracts the supplied archive into a disposable directory, regenerates
the OpenAPI client, substitutes the renamed test-utils package, and runs the
service-level acceptance gates.

The runner uses a locally packed `xq-harness-test-utils` only to prove API
compatibility because that package is not published yet. This is deliberately
not the proposed production dependency contract.

## Run

```bash
NODE_AUTH_TOKEN=... \
  ./prototypes/xq-fitness-write-service-toolchain/run.sh \
  /absolute/path/to/xq-fitness-backend-source-2026-07-20.tar.gz
```

The token must be able to read the `@chauhaidang` packages on GitHub Packages.
The runner prints its scratch directory and preserves it for inspection.

## Observed result on 2026-07-21

Environment: Node 22.15.0 and npm 11.16.0.

| Gate | Result |
| --- | --- |
| OpenAPI client bootstrap before install | Pass |
| Clean npm install | Pass with locally packed test-utils compatibility artifact |
| Service TypeScript build | Pass |
| ESLint | Pass |
| Generated client CommonJS + ESM builds | Pass |
| Unit tests | Pass: 9 suites, 153 tests |
| Published `xq-harness-test-utils` install | Blocked: package is not published |
| Published `xq-harness-test-infra@0.1.1` install | Blocked: published metadata contains `portal:../xq-common-kit` |
| Production image build | Blocked locally: Docker daemon unavailable; also waits on published test-utils |
| Component tests through `xq-infra` | Blocked by the released test-infra package and Docker prerequisites |

## Candidate production contract

- Declare `engines.node` as `>=22.0.0` and `packageManager` as `npm@11.16.0`.
- Generate the ignored OpenAPI client before `npm ci`; keep generator CLI
  `2.25.2` and generator engine `7.17.0` pinned.
- Rename imports and the dependency from `@chauhaidang/xq-test-utils` to
  `@chauhaidang/xq-harness-test-utils`, pinned to a published exact version.
- Keep `xq-infra` out of write-service dependencies. The integration workflow
  installs an exact fixed published CLI version.
- Change both Docker stages from `node:20-alpine` to a pinned Node 22 Alpine
  image before production-image verification.

## Prerequisites exposed by the prototype

1. Publish `@chauhaidang/xq-harness-test-utils`.
2. Republish `@chauhaidang/xq-harness-test-infra` without the `portal:`
   dependency and pin that new version in integration automation.
3. Start a Docker daemon and verify the production image plus the complete
   `xq-infra` component suite using immutable service/database image references.
