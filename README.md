# Rails Migration Assessment

Read-only **mining codemods** that emit [Codemod](https://codemod.com) JSSG metrics for Rails estate inventory and migration readiness. Each miner is safe to run on a target repo — **no files are written**.

These miners do **not** rewrite Ruby into another language. They inventory ActiveRecord shape, API surface, jobs, integrations, and coupling so teams can plan extractions, modularization, upgrades, or destination-language moves with evidence.

Published packages live on the [Codemod Registry](https://app.codemod.com/registry). The public entry point is [`rails-migration-assessment-bundle`](https://app.codemod.com/registry/rails-migration-assessment-bundle).

## Quick start

```bash
# Run the full assessment against a Rails app (from the registry)
npx codemod rails-migration-assessment-bundle -t /path/to/rails-app

# Or clone this repo and run the local workflow (all 16 miners)
pnpm install
pnpm test:bundle
# or against your own app:
npx codemod workflow run -w codemods/rails-migration-assessment-bundle/workflow.local.yaml \
  -t /path/to/rails-app --allow-dirty --no-interactive
```

Requires **Node 22+** and network access the first time (Codemod CLI is fetched via `npx`).

## What it inventories

Example programs that benefit from this suite:

- Extracting a Rails engine or domain into a service (Node.js / TypeScript, Go, Java, Elixir, …)
- Modularizing a monolith (clearer engine boundaries, shared-table ownership)
- Ruby / Rails upgrades and modernization where structural risk matters first
- Sequencing shadow traffic, dual-run, or strangler-fig rollouts

## Bundle (all miners)

| Package | Registry |
| --- | --- |
| [`rails-migration-assessment-bundle`](codemods/rails-migration-assessment-bundle/) | [public pro](https://app.codemod.com/registry/rails-migration-assessment-bundle) |

## Packages

| Package | Registry | Metrics |
| --- | --- | --- |
| [`rails-activerecord-model-mining`](codemods/rails-activerecord-model-mining/) | public pro | `rails-activerecord-model` |
| [`rails-association-mining`](codemods/rails-association-mining/) | public pro | `rails-association` |
| [`rails-callback-mining`](codemods/rails-callback-mining/) | public pro | `rails-callback` |
| [`rails-validation-mining`](codemods/rails-validation-mining/) | public pro | `rails-validation` |
| [`rails-sti-mining`](codemods/rails-sti-mining/) | public pro | `rails-sti` |
| [`rails-raw-sql-mining`](codemods/rails-raw-sql-mining/) | public pro | `rails-raw-sql` |
| [`rails-transaction-mining`](codemods/rails-transaction-mining/) | public pro | `rails-transaction` |
| [`rails-controller-endpoint-mining`](codemods/rails-controller-endpoint-mining/) | public pro | `rails-controller-endpoint` |
| [`rails-serializer-mining`](codemods/rails-serializer-mining/) | public pro | `rails-serializer` |
| [`rails-service-object-mining`](codemods/rails-service-object-mining/) | public pro | `rails-service-object` |
| [`rails-background-job-mining`](codemods/rails-background-job-mining/) | public pro | `rails-background-job` |
| [`rails-redis-mining`](codemods/rails-redis-mining/) | public pro | `rails-redis` |
| [`rails-external-integration-mining`](codemods/rails-external-integration-mining/) | public pro | `rails-external-integration` |
| [`rails-request-test-mining`](codemods/rails-request-test-mining/) | public pro | `rails-request-test` |
| [`rails-cross-domain-dependency-mining`](codemods/rails-cross-domain-dependency-mining/) | public pro | `rails-cross-domain-dependency` |
| [`rails-shared-table-mining`](codemods/rails-shared-table-mining/) | public pro | `rails-shared-table` |

## Development

```bash
pnpm install
pnpm test          # fixture tests for every miner + bundle workflow validation
pnpm check-types   # TypeScript check for miners
pnpm test:bundle   # smoke-run local bundle against sample Rails fixtures
```

## License

[MIT](./LICENSE)
