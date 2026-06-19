# Exec Plan

## Goal

Allow every reusable CD caller to pass GitHub's permission validation while
keeping write access scoped to the release job.

## Scope

In scope:

- GitHub Packages callers grant `contents: read` and `packages: write`.
- The tarball release caller grants `contents: write`.
- Workflow syntax and permission parity are checked locally.

Out of scope:

- Dispatching workflows or publishing artifacts during validation.

## Risk Classification

Risk flags:

- External systems.
- Existing release behavior.

Hard gates:

- External provider behavior.

## Work Phases

1. Inspect caller and reusable workflow permissions.
2. Add matching job-level permissions.
3. Parse all workflow YAML and assert permission parity.
4. Record validation without dispatching a release.

## Stop Conditions

Pause for human confirmation if release credentials, triggers, or package
publishing behavior must change.
