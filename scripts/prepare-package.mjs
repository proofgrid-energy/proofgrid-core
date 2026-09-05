// SPDX-License-Identifier: MPL-2.0
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('.local-checks/package', {recursive:true});
mkdirSync('.local-checks/consumer', {recursive:true});
writeFileSync('.local-checks/consumer/package.json', JSON.stringify({name:'proofgrid-artifact-consumer',private:true,type:'module'}));
writeFileSync('.local-checks/consumer/smoke.ts', "import { validateEvidence, evaluateSelectedPack, type Selection, type EvaluationResult } from '@proofgrid/core';\nconst selection: Selection = { jurisdiction: 'example', date: '2026-09-05' };\nconst result: EvaluationResult = evaluateSelectedPack({}, {}, selection);\nconst valid: boolean = validateEvidence({}).valid;\nvoid [result, valid];\n");
