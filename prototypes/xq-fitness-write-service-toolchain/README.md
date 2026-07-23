# PROTOTYPE — XQ Fitness write-service toolchain

This local acceptance runner answers GitHub issue #43 without package-registry
credentials or pre-published service/database images. It consumes three exact
package tarballs, extracts the archived write service and database into `/tmp`,
builds uniquely tagged local images, and runs the complete archived component
suite through `xq-infra@0.1.2`.

## Inputs

The runner rejects package tarballs unless their SHA-1 values match:

| Package | Version | Required SHA-1 |
| --- | --- | --- |
| `@chauhaidang/xq-harness-test-utils` | `0.1.1` | `32888639ae58798891d47f0ac7adcee7699dc940` |
| `@chauhaidang/xq-harness-test-infra` | `0.1.2` | `7eac12c279fa737f35fce643bc8f3f84035fcc92` |
| `@chauhaidang/xq-harness-common-kit` | `0.1.0` | `3d3817768521562add1d00e7e7adf64cce38ac68` |

The three tarballs are installed together as local file dependencies, allowing
the internal package graph to resolve without GitHub Packages or
`NODE_AUTH_TOKEN`. Public npm dependencies and Docker base images still use
their normal configured registries when absent from local caches.

## Command

```bash
TEST_UTILS_TARBALL=/absolute/path/to/chauhaidang-xq-harness-test-utils-0.1.1.tgz \
TEST_INFRA_TARBALL=/absolute/path/to/chauhaidang-xq-harness-test-infra-0.1.2.tgz \
COMMON_KIT_TARBALL=/absolute/path/to/chauhaidang-xq-harness-common-kit-0.1.0.tgz \
./prototypes/xq-fitness-write-service-toolchain/run.sh \
  /absolute/path/to/xq-fitness-backend-source-2026-07-23.tar.gz
```

The runner requires Node 22, npm 11.16.0, and a working Docker daemon. Colima
users must set `SCRATCH_PARENT` to a shared path under `/Users`; its VM cannot
bind-mount the default macOS `/private/tmp` path used by `mktemp`. It:

1. verifies the archive and package hashes;
2. generates the ignored OpenAPI client and installs all three package
   tarballs together;
3. verifies the exact installed package and CLI versions;
4. runs service build, lint, client build, and unit tests;
5. statically asserts 9 component suites, 44 test declarations, and 20 OpenAPI
   operations;
6. builds both archive-derived local image tags and records their image IDs
   before and after the build;
7. uses exact `xq-infra@0.1.2` to generate Compose from the archived service
   definitions, asserts that its database/service references use the unique
   local tags, and starts them with `--no-pull`;
8. runs the single complete component row; and
9. always captures bounded logs and tears down generated infrastructure.

The scratch evidence directory contains a manifest, bounded service logs, and
JUnit XML. Failure is a STOP; the scratch directory is preserved for diagnosis.

## Acceptance result

The replacement snapshot passed the complete runner on 2026-07-23 with Node
`22.15.0` and npm `11.16.0`. It was bound to archive SHA-256
`3c5fa62a3c7437aad27e14c227e35b540f5f5b125b05457007e1452047ae76c5`:

- build, lint, generated CommonJS/ESM client build, and 9 unit suites / 153
  tests passed;
- both archive-derived images were rebuilt under unique immutable local tags;
- exact `xq-infra@0.1.2` started those tags with `--no-pull`;
- all 9 component suites / 44 tests passed against the disposable database;
- all 20 OpenAPI `operationId` entries were present; and
- teardown completed with no running matrix containers.

The resulting database image ID was
`sha256:b050944a0994068b83f467ac5bd1defa63588a09df68f35b5201e0aad88fe07a`;
the service image ID was
`sha256:369958bb50fb09d16737a9d483c3f4d8471e9226d3f80a1b8c423b644ead43dc`.
The earlier 2026-07-22 pass remains historical evidence bound to the deleted
archive and is not replacement-snapshot acceptance.

The runner remains the reproducible pre-import acceptance gate. Its service log,
JUnit XML, package hashes, and image IDs are retained in the reported scratch
evidence directory for each execution.
