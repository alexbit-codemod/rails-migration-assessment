# rails-raw-sql-mining

Read-only **mining codemod** that detects Raw SQL usage (`find_by_sql`, `execute`, string SQL, `Arel.sql`) for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-raw-sql` | `sqlKind`, `risk`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
