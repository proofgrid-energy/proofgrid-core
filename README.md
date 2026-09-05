# proofgrid-core

Canonical evidence schemas for distributed solar installation and service records. Manufacturer requirements are external Rule Packs owned by [proofgrid-registry](https://github.com/proofgrid-energy/proofgrid-registry). Stellar verification is a later, separate layer.

**Status: M1 schema draft.** The JSON Schema files, local schema-only npm artifact and fixture checks work with the tooling described below. The planned TypeScript/Ajv library and CI are not implemented or validated yet because dependency installation is unavailable in the implementation environment. There is no CLI warranty validator to install.

## Artifacts

- [Evidence schema](schemas/0.1/evidence.schema.json): twelve typed domains, explicit evidence states, scoped authorization and structural lifecycle references.
- [Rule Pack schema](schemas/0.1/rule-pack.schema.json): partial coverage, source citations, product/jurisdiction/version metadata and explicit date uncertainty.
- [Minimal synthetic record](examples/minimal-evidence.json).
- [Contract and limitations](docs/contracts.md), [standards mapping status](docs/standards-mapping.md).

Schema validity is not completeness, signature verification, eligibility or claim approval. Private content remains off-chain. No evidence reference is fetched by these checks.

## Run the schema fixture checks

Requires Node.js and an existing VS Code JSON language server (`jsonServerMain.js`, with the `json/validateContent` method). Verification used Node 24.19.0 and the installed `vscode-json-languageserver` 1.3.4. The server is test tooling; it is not a runtime dependency or vendored into this repository.

Set `PROOFGRID_JSON_SERVER` to that server's absolute path. From this repository, use a binary-preserving shell pipeline. For Windows PowerShell, invoke the pipeline through cmd:

```powershell
$env:PROOFGRID_JSON_SERVER = 'C:\path\to\jsonServerMain.js'
cmd /d /c 'node scripts\check-schema-fixtures.mjs emit test\fixtures\evidence-cases.json | node "%PROOFGRID_JSON_SERVER%" --stdio | node scripts\check-schema-fixtures.mjs verify test\fixtures\evidence-cases.json'
```

Run the same command for `purchase-constraint-cases.json` and `rule-pack-cases.json`. On POSIX shells:

```sh
node scripts/check-schema-fixtures.mjs emit test/fixtures/evidence-cases.json \
  | node "$PROOFGRID_JSON_SERVER" --stdio \
  | node scripts/check-schema-fixtures.mjs verify test/fixtures/evidence-cases.json
```

The final verifier must exit zero and report every expected assertion. Missing replies, external schema requests and schema-resolution errors fail the run. The emitter holds its stream open for three seconds to allow in-memory replies; on a slow host, a missing reply is a failed run, not a skipped test. Tests include negative cases so accepting all records cannot pass.

These checks exercise fixture behavior, not full JSON Schema metaschema conformance or the pending Ajv/runtime/typecheck/package acceptance suite. URN cross-schema resolution is not verified by this fallback; constraint tests compose a fresh schema in memory without modifying the canonical schema file. Consumer code must register the versioned schemas locally.

## Check the local schema package

The private `@proofgrid/core@0.1.0-draft.0` package exports only the two versioned JSON schemas. It has no default runtime entry point or dependencies. `private: true` prevents accidental npm publication; local packing is supported. No lockfile is needed for this dependency-free artifact; add one with the runtime dependencies.

From this repository, using Node, npm and tar in PowerShell:

```powershell
New-Item -ItemType Directory -Force .local-checks/package | Out-Null
npm.cmd pack --ignore-scripts --pack-destination .local-checks/package
New-Item -ItemType Directory -Force .local-checks/consumer/node_modules/@proofgrid/core | Out-Null
'{"name":"proofgrid-artifact-consumer","private":true}' | Set-Content -Encoding ascii .local-checks/consumer/package.json
tar -xzf .local-checks/package/proofgrid-core-0.1.0-draft.0.tgz -C .local-checks/consumer/node_modules/@proofgrid/core --strip-components=1
node scripts/check-package-consumer.mjs .local-checks/consumer
```

The check resolves both public schema exports from that consumer, compares their exact bytes with source, checks the entire artifact file inventory (including license notices), and rejects a default runtime entry point and unsupported schema version. It does not exercise the pending TypeScript library or npm dependency installation. Consumers can load `@proofgrid/core/schemas/0.1/evidence.schema.json` and `@proofgrid/core/schemas/0.1/rule-pack.schema.json` through their JSON loader and register the schemas in their validator.

## License

New source is MPL-2.0. See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md) for the prospective change and preserved earlier Apache grants. This README was expanded from the initial title-only template on 2026-09-05.
