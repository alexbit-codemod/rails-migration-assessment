# rails-background-job-mining

Read-only **mining codemod** that detects ActiveJob / ApplicationJob background job classes for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-background-job` | `jobClass`, `baseClass`, `queue`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
