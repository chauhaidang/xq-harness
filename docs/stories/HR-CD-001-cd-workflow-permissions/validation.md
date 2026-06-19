# Validation

## Proof Strategy

Parse every workflow and assert that each reusable CD caller grants permissions
at least as strong as its called workflow requests.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | YAML syntax parses for every workflow. |
| Integration | npm callers grant package write; tarball caller grants content write. |
| E2E | Deferred to the next intentional release or manual dispatch. |
| Platform | GitHub accepts the workflow before runner startup. |

## Fixtures

No package version or release fixture is required for static validation.

## Commands

```text
ruby -e 'require "yaml"; Dir[".github/workflows/*.yml"].each { |f| YAML.parse_file(f) }'
./scripts/check-cd-workflow-permissions
```

## Acceptance Evidence

- All 15 workflow YAML files parsed successfully.
- All npm and tarball caller/callee permission assertions passed.
- No workflow was dispatched and no artifact was published during validation.
