# Contributing

Use Node 24+ and npm. Clone this repository, run npm ci, then npm run typecheck, npm test and npm run test:package. In PowerShell use npm.cmd. Each repository works without sibling checkouts; vendored core artifacts are deliberate pinned captures.

Open a focused proposal or choose a task in docs/backlog.md. Explain the actual problem, scope, expected behavior and acceptance check. Agree source/schema changes before broad implementation. Do not create activity merely for bounty points.

Keep commits coherent. Pull requests should explain behavior, include relevant positive/negative tests and record actual command results. Do not alter unrelated code, generated lockfiles by hand, or license notices. Generated code remains the contributor's responsibility; understand and review it. Maintainers review source correctness, tests, privacy and compatibility before merging.

Core must have no manufacturer-specific branches or runtime dependency on registry/Stellar. Schema/version changes need a migration note and packed-consumer checks.

New source uses MPL-2.0; preserve earlier Apache notices. Contributors retain their copyright. No CLA or attribution trailer is required by this project. Do not include private customer data, production credentials or manufacturer documents without a supported redistribution basis.
