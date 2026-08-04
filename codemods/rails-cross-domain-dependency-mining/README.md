# rails-cross-domain-dependency-mining

Read-only **mining codemod** that detects Cross-domain / cross-namespace constant dependencies for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-cross-domain-dependency` | `sourceDomain`, `targetConstant`, `targetDomain`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
