# rails-external-integration-mining

Read-only **mining codemod** that detects External HTTP integrations (Faraday, HTTParty, RestClient, Net::HTTP, …) for Rails migration assessment. No files are written to the target repo.

> **Registry:** public pro. Use the public [`rails-migration-assessment-bundle`](../rails-migration-assessment-bundle/) to run all miners in one workflow.

## Metrics

| Metric | Cardinalities |
| --- | --- |
| `rails-external-integration` | `integrationKind`, `risk`, `file`, `line`, `snippet` |

Every finding includes `file` (relative path) and `line` (1-based).
