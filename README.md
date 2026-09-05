# proofgrid-core

Canonical evidence schemas for distributed solar installation and service records. Manufacturer requirements are external Rule Packs owned by [proofgrid-registry](https://github.com/proofgrid-energy/proofgrid-registry). Stellar verification is a later, separate layer.

**Status: M1 schema draft.** The JSON Schema files and fixture checks work with the locally available validator described below. The planned TypeScript/Ajv library, npm packaging and CI are not implemented or validated yet because dependency installation is unavailable in the implementation environment. There is no CLI warranty validator to install.

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

## License

New source is MPL-2.0. See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md) for the prospective change and preserved earlier Apache grants. This README was expanded from the initial title-only template on 2026-09-05.
