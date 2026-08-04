# rails-service-object-mining

Read-only **mining codemod** that detects Service objects with `call` / `perform` / `execute` entrypoints for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-service-object` | `className`, `entryMethod`, `pathKind`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
