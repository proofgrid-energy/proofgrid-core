# Local solar evidence assessment core

Prepared October 8, 2026 for same-day Stellar Wave application.

## Implemented utility

TypeScript library and CLI validate versioned evidence and rule-pack schemas, evaluate supplied constraints and preserve unresolved outcomes. Rule packs and Stellar publication are separate consumers.

## Reproduce and evidence

Node 24+; npm ci, npm run typecheck, npm test, npm run test:package. Record actual October 8 check results in VERIFICATION_OCT09.md.

## Supported scope

Core does not verify physical events, manufacturer authority or legal eligibility. Stellar relevance is the proofgrid-stellar consumer; core itself does not deploy a contract.

## Maintainers and application

Maintainers xteesamz and EthTobi were owner-confirmed across these project families; contact through GitHub, available anytime. Follow CONTRIBUTING.md and SECURITY.md (or organization defaults). Review the preparation PR and its CI before using its final revision in the application. Engineering issues and draft complexity do not establish Wave enrollment. No application has been submitted by this work.
