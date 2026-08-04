# rails-association-mining

Read-only **mining codemod** that detects ActiveRecord associations (`has_many`, `belongs_to`, etc.), including polymorphic for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-association` | `className`, `associationType`, `name`, `polymorphic`, `risk`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
