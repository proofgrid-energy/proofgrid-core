# proofgrid-core

Canonical evidence schemas and a small TypeScript validation library for distributed solar installation and service records. Manufacturer rules belong in proofgrid-registry; Stellar verification is a later, separate layer.

**Status: M1 draft walking skeleton.** Validation separates evidence structure, partial constraint outcomes and applicability. It does not establish completeness, authorization, physical truth, warranty readiness or approval.

## Validate and build

Requires Node 24 or later and npm. In PowerShell use npm.cmd.

```sh
npm ci
npm run typecheck
npm test
npm run test:package
```

Tests use project-local Ajv 8.20.0 with JSON Schema 2020-12 and ajv-formats 3.0.1. TypeScript 7.0.2 emits the library and declarations. The Node test runner uses in-process isolation to accommodate environments that prohibit spawning test workers. The original language-server fixture helper remains available but is not required by these commands.

## Library

The private local package @proofgrid/core@0.2.0-draft.0 exports validateEvidence(data), validateRulePack(pack) and evaluateSelectedPack(data, pack, selection?). The first two return {valid, errors}. The evaluator returns separate evidence and pack validation, applicability, partial coverage and per-rule statuses. Inputs are never coerced, defaulted or changed.

Selection supplies an exact jurisdiction label and optional ISO calendar date. Manufacturer, model and product type must match the record's primary asset. No region expansion, case normalization or automatic pack selection occurs. A missing/invalid date or unknown pack effective date leaves applicability unknown; source review dates never substitute for effective dates. Explicit scope/date mismatches return not_matched and no rule outcomes.

When scope is compatible but applicability unknown, named constraints can still report satisfied/unsatisfied as an explicit experiment. Unresolved rules remain unresolved. No aggregate readiness result is returned. Pack errors prevent rule evaluation, including unsupported versions, unknown citations, duplicate IDs, malformed constraints, unknown keywords, unresolved schema references and asynchronous schemas.

Use reviewed Rule Packs as local configuration. Constraint compilation is synchronous and provides no CPU/memory sandbox for arbitrary hostile schemas. No schema or evidence URL is fetched. Canonical URNs resolve locally. Ajv's strict keyword checks are enabled; strictTypes and strictRequired are disabled to allow valid cross-subschema composition. See [Ajv JSON Schema support](https://ajv.js.org/json-schema.html).

## Artifacts and package check

The package exports [evidence](schemas/0.1/evidence.schema.json) and [Rule Pack](schemas/0.1/rule-pack.schema.json) schemas through their versioned subpaths, plus the library at its default ESM entry point. See [contract](docs/contracts.md), [standards status](docs/standards-mapping.md) and [synthetic example](examples/minimal-evidence.json). A local CLI is included; no server or chain integration is required.

The package check builds, packs with scripts disabled, installs the tarball into an isolated consumer with its own package.json, resolves the public ESM and schema exports, checks the exact 19-file inventory and license notices, compares source schema bytes and runtime schema content, rejects unsupported versions, and executes positive/negative runtime cases. It never publishes. Generated artifacts remain under ignored .local-checks/. private: true guards publication.

CI runs the same commands in a standalone checkout. A committed workflow is not evidence of a successful remote CI run.

## License

New source is MPL-2.0. See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md) for prospective scope and preserved earlier Apache grants.

## Assess a claim record

After npm run build, run:

```sh
node dist/src/cli.js assess --record ../proofgrid-registry/examples/dyness-claim.json --catalog ../proofgrid-registry/catalog.json --jurisdiction africa --date 2026-09-05 --format text
```

This explicit integration example returns review_required (exit 2), because the source effective date and some rules remain unresolved. Paths are user-supplied inputs, not runtime imports. Consumers of the packed artifact can use the proofgrid executable. validate checks structure, check-pack checks a Rule Pack, and assess produces either JSON (default) or a readable report with rule IDs, errors and citations.

Exit 0 means scoped_checks_met; 1 incomplete; 2 review_required; 3 invalid input or usage. No status means warranty approval. Multiple matching versions remain ambiguous rather than selecting a guessed latest version. Explicit --pack selects one version for review. Catalog paths stay inside their directory; symlink escapes are rejected. Inputs are limited to 5 MiB per file and 100 catalog entries.

The SDK exports assessEvidence(record, packs, selection?) and inspectReferences(record). The report checks in-record evidence/actor/service references, duplicate identifiers, unavailable referenced evidence, authorization uncertainty and evidence supersession cycles. External provenance and cross-record lineage still need independent verification; it does not resolve arbitrary storage references.
