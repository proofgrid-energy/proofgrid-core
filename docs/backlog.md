# Contributor backlog

These are local planning items, not published Wave issues.

1. **Reference coverage audit.** Enumerate every canonical reference field, distinguish in-record versus external references, and add precise checks for currently uncovered measurement/provenance links. Acceptance: dangling positive/negative fixtures for each supported field and no automatic external fetches.
2. **Conditional evidence selection.** Design a versioned contract for externally supplied request context without guessing policy triggers. Acceptance: conditional true/false/unknown cases, compatibility tests and source-grounded registry example.
3. **Catalog review dates.** Add an explicit source freshness policy without treating review dates as effective dates. Acceptance: deterministic clock input, stale/unknown/current fixtures and no guessed applicability.
4. **Interoperability mapping.** Implement a small sourced mapping to an established industry model. Acceptance: documented source/version, round-trip example and disclosed semantic loss.
