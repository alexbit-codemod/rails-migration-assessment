# rails-controller-endpoint-mining

Read-only **mining codemod** that detects Rails controller public actions as API endpoints for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-controller-endpoint` | `controller`, `action`, `pathKind`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
