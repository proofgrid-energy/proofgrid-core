# Wave engineering backlog

Drafted October 8, 2026 against current implementation. These are proposed contributor tasks, not Wave enrollment or earned points. Complexity requires maintainer review in the app.

## 1. Bound external evidence and rule-pack input sizes

## Context

Define record/schema/reference limits and reject oversized synthetic inputs without evaluating partial results.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 2. Add schema migration compatibility fixtures

## Context

Document a versioned migration contract and reject unknown schema versions while preserving original records.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

schemas/0.1/, test/

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 3. Add tamper-resistant provenance for rule-pack captures

## Context

Define source digest/signature verification and explicit trust policy; distinguish a digest from manufacturer authorization.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

src/, docs/contracts.md

## Proposed complexity

high; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 4. Exercise independently packed CLI and declaration consumers

## Context

Cover CLI execution, exports, missing files and negative TypeScript usage from a clean install without repository-relative imports.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

scripts/check-package-consumer.mjs, test/

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 5. Document unresolved rule assessment with a Stellar consumer

## Context

Show one bounded record evaluated locally and committed through proofgrid-stellar; explain which facts each layer establishes.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

README.md, docs/

## Proposed complexity

trivial; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## 6. Add hostile reference and schema failure fixtures

## Context

Reject traversal, malformed references and unsupported schema constructs with deterministic errors and no network fetches.

## Acceptance criteria

- Implement and document the specific behavior above.
- Cover positive, negative and unavailable-input cases appropriate to the change.
- Pass the repository documented build/test checks and required CI.
- Preserve exact identities/amounts and uncertain evidence outcomes.

## Relevant files

test/, src/

## Proposed complexity

medium; planning only. Actual Wave complexity and enrollment are set by maintainers in the Drips app.

## Contribution

Open a focused feat/fix/test/docs branch. PRs explain behavior and actual validation and include Closes #<issue_id>. Follow CONTRIBUTING.md and SECURITY.md.

## Published contributor issues

- [Bound external evidence and rule-pack input sizes](https://github.com/proofgrid-energy/proofgrid-core/issues/1) — proposed medium.
- [Add schema migration compatibility fixtures](https://github.com/proofgrid-energy/proofgrid-core/issues/2) — proposed medium.
- [Add tamper-resistant provenance for rule-pack captures](https://github.com/proofgrid-energy/proofgrid-core/issues/3) — proposed high.
- [Exercise independently packed CLI and declaration consumers](https://github.com/proofgrid-energy/proofgrid-core/issues/4) — proposed medium.
- [Document unresolved rule assessment with a Stellar consumer](https://github.com/proofgrid-energy/proofgrid-core/issues/5) — proposed trivial.
- [Add hostile reference and schema failure fixtures](https://github.com/proofgrid-energy/proofgrid-core/issues/6) — proposed medium.
