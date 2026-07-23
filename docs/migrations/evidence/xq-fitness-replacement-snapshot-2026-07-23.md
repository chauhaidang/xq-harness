# XQ Fitness replacement snapshot acceptance evidence

Issue: [#61](https://github.com/chauhaidang/xq-harness/issues/61)

Evidence date: 2026-07-23

Decision: **GO for curated import**

This manifest contains only sanitized, reproducible facts. The replacement
archive, package tarballs, generated clients, registry configuration, service
logs, JUnit XML, and raw provider responses remain ignored or in disposable
scratch storage. No credential or standalone `.npmrc` content is retained here.

## Provenance

| Root | Pinned standalone commit |
| --- | --- |
| `write-service/` | `chauhaidang/xq-fitness-write@49ebb1baa58c377b6e8281463db491d077ab086b` |
| `database/` | `chauhaidang/xq-fitness-db@450f6b6157f622dc3f6a98fdaa52953ce4c88ae3` |
| `xq-records/` | `chauhaidang/xq-records@d9acc0fa21b16968c6cdf196c5e1ad63ff9a809b` |

The normalized archive is
`xq-fitness-backend-source-2026-07-23.tar.gz`, SHA-256
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`.
It has 208 entries under exactly the three roots above. Two independent
assemblies using sorted paths, normalized owners and timestamps, and gzip with
no timestamp produced the same SHA-256. Inspection found no absolute or
traversal paths, symlinks, or special files.

The raw write-service source contains the known standalone `.npmrc`. It was not
displayed, copied into evidence, or admitted to the import set.

## Dependency gate

The audit candidate was rebuilt from the pinned `write-service/` root with only
the previously approved deterministic changes: replace the obsolete test-utils
package with `@chauhaidang/xq-harness-test-utils@0.1.1`, pin
`ts-node@10.9.2`, upgrade `jest-junit@17.0.0`, and normalize the generated local
client stub. Its npm lockfile SHA-256 is
`c952d018bba8aa9246037b31f96ef619502faced8b78a61c8e3493d99ed11233`.

On Node `22.15.0` and npm `11.16.0`, npm's public advisory endpoint returned
zero production and zero development findings at every severity. The policy
checker passed, as did the clean production install and complete production
tree. The current GitHub token did not have `read:packages`, so a second clean
development install through GitHub Packages could not be repeated locally;
the same lock and exact internal releases already passed that gate in GitHub
Actions run 29933182931. The source-sensitive build and complete component
matrix below independently installed the exact package tarballs and passed.

The component package adds a development-only
`@chauhaidang/xq-harness-test-infra@0.1.2 -> uuid@9.0.1` deprecation warning.
It has no current npm advisory, does not enter the production image, and is
owned by [#58](https://github.com/chauhaidang/xq-harness/issues/58) with target
date 2026-10-20. The audit candidate's former `jest-junit -> uuid@8` path is
absent; `jest-junit@17` resolves to `uuid@14`.

## Service and component gate

The replacement archive passed the acceptance runner on Node `22.15.0` and npm
`11.16.0` using exact local copies of the published packages:

| Package | Version | Tarball SHA-1 |
| --- | --- | --- |
| `@chauhaidang/xq-harness-test-utils` | `0.1.1` | `32888639ae58798891d47f0ac7adcee7699dc940` |
| `@chauhaidang/xq-harness-test-infra` | `0.1.2` | `7eac12c279fa737f35fce643bc8f3f84035fcc92` |
| `@chauhaidang/xq-harness-common-kit` | `0.1.0` | `3d3817768521562add1d00e7e7adf64cce38ac68` |

Build, lint, generated CommonJS and ESM clients, 9 unit suites with 153 tests,
and all 20 OpenAPI operations passed. The runner built and used these immutable
local identities with `--no-pull`:

| Image | Image ID |
| --- | --- |
| `xq-fitness-db:acceptance-3c5fa62a3c74` | `sha256:b050944a0994068b83f467ac5bd1defa63588a09df68f35b5201e0aad88fe07a` |
| `xq-fitness-write-service:acceptance-3c5fa62a3c74` | `sha256:369958bb50fb09d16737a9d483c3f4d8471e9226d3f80a1b8c423b644ead43dc` |

Exact `xq-infra@0.1.2` generated and started the disposable matrix. All 9
component suites and 44 tests passed. JUnit recount confirmed those values,
service logs were captured in disposable storage, teardown completed, and no
matrix container remained running.

## Disposition

The replacement provenance is deterministic, every source-sensitive gate
passed, both advisory scopes have zero findings, and every observed deprecation
has an owner. Issue #46 may consume only the archive and checksum recorded
above, must exclude the standalone `.npmrc`, and must apply the approved audit
candidate changes during the write-service tracer bullet.
