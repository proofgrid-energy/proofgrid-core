# ProofGrid v0.1 contract

Status: M1 draft, 2026-09-05. This document precedes the schema implementation. SPDX-License-Identifier: MPL-2.0.

Core owns the canonical evidence schema and Rule Pack envelope. Registry owns manufacturer mappings, sources and constraints. Stellar consumes a future versioned manifest; it is not imported by core. No repository imports a sibling's source at runtime.

## Versions and scope

Canonical records carry `schema_version: "0.1"`. Schemas use JSON Schema 2020-12 and stable URN identifiers resolved from local artifacts, not network downloads. A future core package will export these schemas; registry will pin a checksummed copy from the package until a release exists. Unknown contract versions must be rejected.

A record is an off-chain container for evidence about one primary asset. Serial numbers are opaque strings: no manufacturer's serial format is imposed by core. Additional assets/components are explicitly typed references. Twelve domains remain first-class: Asset, Purchase, Installation, SystemConfiguration, Fault, Diagnostics, ServiceEvent, ReplacementEvent, Evidence, Actor, Authorization and Provenance.

Only identifiers and structural envelope fields are globally mandatory. Manufacturer-required evidence belongs in a pack, so a structurally valid record can still lack purchase/fault/installation evidence. Unknown core keys are rejected to catch mapping mistakes. Do not add an arbitrary extension bag to claim extensibility; propose a typed general concept when needed.

## Evidence and provenance

Evidence status is one of present, missing, unverified, verified, expired, revoked, superseded, not_applicable. Presence does not establish verification. Missing/not_applicable evidence has no fabricated content pointer or content hash. Structured measurements contain values and units; unstructured documents use opaque off-chain references. Validation never downloads references.

Authorization has its own state and actor/manufacturer/event-role scope. A repair can be present with unverified authorization. Declared verified status is an input assertion; schema validation never verifies a signature or changes a state. Scoped authorization evidence, times and source actor can be represented without building an identity service.

Provenance stores issuer, issuance time and optional off-chain source/attestation references. Revocation and supersession are structural references in M1. Replacement links previous and replacement typed assets; record history is preserved. JSON Schema validates reference shapes, not cross-record referential integrity, authorization enforcement, graph cycles or chronological consistency. Those remain explicit later checks.

## Rule Pack envelope

Packs carry contract/pack version, manufacturer, product scope, jurisdiction, source documents with locators/review dates, effective-date knowledge, revision history and coverage limitations. Effective dates may be explicitly unknown for research drafts and must never be replaced with a review date.

Every rule has source citations and a required/conditional/contextual classification. An executable rule contains a JSON Schema constraint over canonical paths. An unresolved rule has a reason and no executable constraint. M1 demonstrates required evidence only; general conditional evaluation and automatic policy resolution remain M3. Do not silently count a quarantined rule as satisfied.

Evaluation must first validate the evidence and pack shapes, then require an explicitly selected matching manufacturer/product/jurisdiction/contract version. Unknown date applicability stays unknown. A partial pack reports results only for its named constraints, never overall warranty readiness or approval. Presence constraints must require a non-missing state as well as data where that state is relevant.

Future runtime must reject unsupported schemas, unresolved external schema references and untrusted executable code. Rule data must not initiate network access. JSON Schema keywords are not an authorization or physical-truth mechanism.

## M1 acceptance boundary

Fixtures must demonstrate shared serial/fault paths for three manufacturer labels, a typed paired-inverter constraint supplied externally, missing purchase evidence without inference, unverified service authorization, and replacement/revocation/supersession representation. Synthetic fixtures prove structure, while registry source mappings establish factual motivation. Neither proves complete manufacturer policy coverage.

Core schema tests run independently of registry. Registry will test its real partial pack against the pinned core contract. No public CLI, automatic rule resolver, chain SDK, wallet, hash canonicalization protocol or server is required for this slice.
