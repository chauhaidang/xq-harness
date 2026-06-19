# Overview

## Current Behavior

Reusable CD workflows request write permissions that their caller jobs do not
grant, so GitHub rejects the workflows before any job starts.

## Target Behavior

Each reusable CD caller grants only the write permission required by its
release job. Version-check jobs remain read-only.

## Affected Users

- Module maintainers publishing npm packages or release tarballs.

## Affected Product Docs

- `docs/github-actions.md`

## Non-Goals

- Changing release triggers, package versions, or registry credentials.
- Changing the iOS framework CD workflow, which publishes with a dedicated PAT.
