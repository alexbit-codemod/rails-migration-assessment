# rails-validation-mining

Read-only **mining codemod** that detects ActiveRecord validations for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-validation` | `className`, `validationKind`, `attributes`, `risk`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
