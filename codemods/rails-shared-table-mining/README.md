# rails-shared-table-mining

Read-only **mining codemod** that detects Shared database table signals (`create_table`, `table_name`, references) for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-shared-table` | `tableName`, `modelOrMigration`, `signalKind`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
