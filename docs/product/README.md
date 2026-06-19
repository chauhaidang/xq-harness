# Product Docs

This directory contains product notes for the modules in this repository.

When a user provides a project spec, derive smaller product contract files here
instead of keeping one large spec as the living plan. Name files by the product
domains that actually exist in that spec, for example `overview.md`,
`billing.md`, `workflows.md`, `permissions.md`, or `api-conventions.md`.

Do not create domain files before the spec just to fill the folder. Empty
structure is healthier than fake product truth.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the related story note when the change is story-sized.
3. Run the relevant module verification command.
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
