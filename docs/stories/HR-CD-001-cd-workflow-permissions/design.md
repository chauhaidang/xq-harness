# Design

## Application Flow

GitHub validates the caller job's token ceiling before invoking a reusable
workflow. The caller therefore grants the same permissions requested by the
called workflow.

## UI / Platform Impact

- npm publish jobs: `contents: read`, `packages: write`.
- tarball release job: `contents: write`.
- iOS framework publishing remains unchanged because it uses a dedicated PAT.

## Observability

GitHub Actions workflow validation and subsequent job status provide release
evidence.

## Alternatives Considered

1. Repository-wide write permissions were rejected because they would grant
   unnecessary access to version checks and unrelated workflows.
2. Duplicating reusable workflow steps into callers was rejected because the
   failure is a permission ceiling mismatch, not a reuse limitation.
