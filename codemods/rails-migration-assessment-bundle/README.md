# rails-migration-assessment-bundle

Read-only **workflow bundle** for Rails migration assessment. It runs 16 atomic mining codemods in one pass and accumulates metrics in the Codemod run output — **no files are written to the target repo**.

Use it to baseline Rails estate shape, ActiveRecord complexity, API surface, jobs, integrations, and coupling before you commit to a plan. The bundle is destination-agnostic: the same inventory supports service extraction (e.g. Node.js / TypeScript, Go, Java), in-place modularization, and modernization / upgrade risk reviews.

## Metrics

Each metric is emitted as a counted cardinality record: a set of metadata fields (`cardinality`) plus a `count`. Every finding includes `file` and `line`.

| Metric | Package | Key cardinalities |
| --- | --- | --- |
| `rails-activerecord-model` | `rails-activerecord-model-mining` | `className`, `baseClass`, `pathKind`, `file`, `line` |
| `rails-association` | `rails-association-mining` | `associationType`, `name`, `polymorphic`, `risk`, `file`, `line` |
| `rails-callback` | `rails-callback-mining` | `callbackType`, `target`, `risk`, `file`, `line` |
| `rails-validation` | `rails-validation-mining` | `validationKind`, `attributes`, `risk`, `file`, `line` |
| `rails-sti` | `rails-sti-mining` | `className`, `parentClass`, `risk`, `file`, `line` |
| `rails-raw-sql` | `rails-raw-sql-mining` | `sqlKind`, `risk`, `file`, `line` |
| `rails-transaction` | `rails-transaction-mining` | `transactionKind`, `risk`, `file`, `line` |
| `rails-controller-endpoint` | `rails-controller-endpoint-mining` | `controller`, `action`, `file`, `line` |
| `rails-serializer` | `rails-serializer-mining` | `serializerClass`, `framework`, `file`, `line` |
| `rails-service-object` | `rails-service-object-mining` | `className`, `entryMethod`, `file`, `line` |
| `rails-background-job` | `rails-background-job-mining` | `jobClass`, `baseClass`, `queue`, `file`, `line` |
| `rails-redis` | `rails-redis-mining` | `operation`, `clientHint`, `file`, `line` |
| `rails-external-integration` | `rails-external-integration-mining` | `integrationKind`, `risk`, `file`, `line` |
| `rails-request-test` | `rails-request-test-mining` | `testKind`, `describeTarget`, `file`, `line` |
| `rails-cross-domain-dependency` | `rails-cross-domain-dependency-mining` | `sourceDomain`, `targetConstant`, `targetDomain`, `file`, `line` |
| `rails-shared-table` | `rails-shared-table-mining` | `tableName`, `signalKind`, `file`, `line` |
