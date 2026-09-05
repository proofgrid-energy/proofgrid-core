# ProofGrid Core

[![CI](https://github.com/proofgrid-energy/proofgrid-core/actions/workflows/ci.yml/badge.svg)](https://github.com/proofgrid-energy/proofgrid-core/actions/workflows/ci.yml)

**Common evidence schemas, local validation, and a CLI/SDK for distributed solar records.**

Solar equipment records span purchase, installation, commissioning, faults, repairs and replacements. ProofGrid Core gives developers a shared structure for those records and checks them against explicitly scoped evidence requirements. Reports distinguish missing evidence, unresolved questions and checks that have been met.

**Status: functional developer preview.** The TypeScript library, CLI and local package work today. Assessments cover named evidence checks; they do not establish complete warranty eligibility, manufacturer approval or physical truth. Production readiness remains future work.

## Where this repository fits

| Repository | Responsibility |
| --- | --- |
| **proofgrid-core** | Canonical schemas, Rule Pack contract, validation and assessment |
| [proofgrid-registry](https://github.com/proofgrid-energy/proofgrid-registry) | Manufacturer sources, scoped Rule Packs and fixtures |
| [proofgrid-stellar](https://github.com/proofgrid-energy/proofgrid-stellar) | Optional private commitments and Stellar testnet current-status verification |

Core runs locally without the other repositories, a server, a wallet or a blockchain connection. Manufacturer logic is supplied as Rule Packs rather than branches in core code.

## Quick start

Requires **Node.js 24+**, npm and Git. The package is a private development artifact and is not published to npm; start from this repository.

```sh
git clone https://github.com/proofgrid-energy/proofgrid-core.git
cd proofgrid-core
npm ci
npm run build
node dist/src/cli.js validate --record examples/minimal-evidence.json
```

Expected result: `{"valid":true,"errors":[]}` and exit code `0`. This checks the synthetic record's structure; it does not assess a manufacturer's requirements.

**Windows PowerShell:** use `npm.cmd` wherever these instructions say `npm`. If Node is installed in `C:\Program Files\nodejs` but commands are not found, add that existing folder to the current terminal's PATH:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
node --version
npm.cmd --version
```

Run commands one at a time. Keep a command and its options on the same line, including `--date` and `--format`; copy the commands without terminal prompts.

## Assess manufacturer evidence

For a complete runnable manufacturer example, use the [registry quick start](https://github.com/proofgrid-energy/proofgrid-registry#quick-start). It includes the core artifact, catalog and synthetic records in one checkout.

If registry is already cloned alongside this repository, run this single line from core after building:

```sh
node dist/src/cli.js assess --record ../proofgrid-registry/examples/dyness-claim.json --catalog ../proofgrid-registry/catalog.json --jurisdiction africa --date 2026-09-05 --format text
```

The example returns `review_required` with exit code `2`: five named Dyness checks are satisfied, three rules remain unresolved, and date applicability is unknown. The date is an explicit demonstration input; it does not resolve unknown source effective dates. These sibling paths are optional input files, not runtime dependencies.

### CLI commands and outcomes

| Command | Purpose |
| --- | --- |
| `validate --record FILE` | Validate evidence structure |
| `check-pack --pack FILE` | Validate a Rule Pack and its constraints |
| `assess --record FILE --pack FILE` | Assess one explicitly supplied pack |
| `assess --record FILE --catalog FILE` | Select from a local catalog and assess, preserving ambiguity |

From a source checkout, prefix commands with `node dist/src/cli.js`. An installed local core package also provides the `proofgrid` executable. Run `node dist/src/cli.js --help` for usage. Assessments default to JSON; `--format text` adds a readable report with rule citations and findings. `--date YYYY-MM-DD` requires `--jurisdiction LABEL`.

| Assessment exit code | Outcome | Meaning |
| --- | --- | --- |
| `0` | `scoped_checks_met` | The selected scoped checks are met; this is not full-policy approval |
| `1` | `incomplete` | Evidence requirements or reference checks are not met |
| `2` | `review_required` | Applicability, selection or evidence questions need review |
| `3` | `invalid` | Invalid input, catalog, pack or command usage |

`validate` and `check-pack` return `0` for valid input and `3` for invalid input. A structurally valid record can still lack evidence needed for an assessment.

## Use the SDK

This example runs from the built source checkout with Node's ESM support:

```js
import { readFileSync } from 'node:fs';
import { validateEvidence, inspectReferences } from './dist/src/index.js';

const record = JSON.parse(readFileSync('examples/minimal-evidence.json', 'utf8'));
console.log(validateEvidence(record));
console.log(inspectReferences(record));
```

Consumers of the installed local artifact import from `@proofgrid/core` instead.

| Export | Result |
| --- | --- |
| `validateEvidence(record)` | Structural validity and errors |
| `validateRulePack(pack)` | Pack validity and errors |
| `evaluateSelectedPack(record, pack, selection?)` | Validation, applicability, partial coverage and per-rule outcomes |
| `assessEvidence(record, packs, selection?)` | Catalog selection, aggregate scoped outcome, citations and findings |
| `inspectReferences(record)` | Supported in-record reference and evidence-availability findings |

Selection uses `{ jurisdiction, date? }`. Inputs are not coerced, defaulted or mutated. The package also exports the [evidence schema](schemas/0.1/evidence.schema.json) and [Rule Pack schema](schemas/0.1/rule-pack.schema.json) at their versioned `@proofgrid/core/schemas/0.1/…` subpaths. Package version `0.2.0-draft.0` and schema version `0.1` are separate.

## Assessment boundaries

- Manufacturer, model, product type and jurisdiction matching are exact. There is no automatic country-to-region expansion or guessed latest pack version.
- Missing or unknown effective dates preserve unknown applicability. Source review dates never replace policy effective dates. Unresolved rules never become satisfied.
- Reference checks cover supported in-record evidence, actor and service links, duplicate identifiers, evidence availability, authorization uncertainty and supersession cycles. Full reference coverage, external provenance and cross-record history remain incomplete.
- Evidence and schema URLs are never fetched. Reviewed Rule Packs are local configuration, not a CPU/memory sandbox for hostile schemas. The CLI limits each input file to 5 MiB and catalogs to 100 entries, and rejects catalog paths escaping their directory.
- General conditional request-context evaluation, automated source freshness and independently reviewed standards mappings remain backlog. Declared evidence states do not verify document contents or issuer authority.

See the [contract and report semantics](docs/contracts.md), [standards mapping status](docs/standards-mapping.md) and [security guidance](https://github.com/proofgrid-energy/proofgrid-core/blob/main/SECURITY.md).

## Validate your checkout

```sh
npm run typecheck
npm test
npm run test:package
```

The September 5, 2026 preview passed **82 tests**, typecheck and package checks. The package check builds and packs core, installs it in an isolated consumer, verifies the 19-file inventory and schema bytes, checks ESM/types resolution and exercises the CLI entry point. It does not publish a package. Generated files stay under ignored `.local-checks/`.

[CI](https://github.com/proofgrid-energy/proofgrid-core/actions/workflows/ci.yml) runs these checks in a standalone checkout. Tests use project-local Ajv and TypeScript, with Node's in-process test isolation.

## Contribute

Start with the [contributor guide](https://github.com/proofgrid-energy/proofgrid-core/blob/main/CONTRIBUTING.md) and [backlog](https://github.com/proofgrid-energy/proofgrid-core/blob/main/docs/backlog.md). Current work includes reference coverage, conditional evidence selection, source freshness and a sourced interoperability mapping. Schema changes need compatibility review and packed-consumer checks.

Use synthetic records in examples and issues. Follow the [security policy](https://github.com/proofgrid-energy/proofgrid-core/blob/main/SECURITY.md) for sensitive reports.

## License

New ProofGrid source uses [MPL-2.0](LICENSE). [LICENSING.md](LICENSING.md) explains preserved earlier Apache grants and third-party notices.
