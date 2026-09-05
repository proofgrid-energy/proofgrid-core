// SPDX-License-Identifier: MPL-2.0
import { Ajv2020 } from 'ajv/dist/2020.js';
import formats from 'ajv-formats';
import evidenceSchema from '../schemas/0.1/evidence.schema.json' with { type: 'json' };
import packSchema from '../schemas/0.1/rule-pack.schema.json' with { type: 'json' };

export interface ValidationResult { valid: boolean; errors: string[] }
export interface Selection { jurisdiction: string; date?: string }
export interface EvaluationResult {
  evidence: ValidationResult;
  pack: ValidationResult;
  applicability: 'matched' | 'unknown' | 'not_matched';
  coverage: 'partial';
  rules: { rule_id: string; status: 'satisfied' | 'unsatisfied' | 'unresolved'; description?: string; errors?: string[]; citations?: {source_id:string;locator:string}[] }[];
}
interface Pack {
  manufacturer: string;
  product_scope: { product_type: string; models: string[] };
  jurisdiction: string;
  effective: { status: 'unknown' | 'known'; from?: string; until?: string };
  sources: { source_id: string }[];
  rules: { rule_id: string; description:string; reason?:string; status: string; citations: { source_id: string; locator:string }[]; constraint?: object }[];
}
// Strict keyword checking, with type/required composition allowed by JSON Schema.
function engine() {
  const ajv = new Ajv2020({ strict: true, strictTypes: false, strictRequired: false,
    allErrors: true, coerceTypes: false, useDefaults: false, removeAdditional: false });
  formats.default(ajv);
  ajv.addSchema(evidenceSchema);
  return ajv;
}
const ajv = engine();
const evidenceValidator = ajv.getSchema(evidenceSchema.$id)!;
const packValidator = ajv.compile(packSchema);
export function validateEvidence(data: unknown): ValidationResult {
  const valid = evidenceValidator(data) === true;
  return { valid, errors: (evidenceValidator.errors ?? []).map(e => `${e.instancePath}: ${e.message}`) };
}
export function validateRulePack(data: unknown): ValidationResult {
  if (!packValidator(data)) return { valid: false, errors: (packValidator.errors ?? []).map(e => `${e.instancePath}: ${e.message}`) };
  const pack = data as unknown as Pack;
  const errors: string[] = [];
  const sources = new Set(pack.sources.map(s => s.source_id));
  if (sources.size !== pack.sources.length) errors.push('Duplicate source identifiers');
  if (new Set(pack.rules.map(r => r.rule_id)).size !== pack.rules.length) errors.push('Duplicate rule identifiers');
  if (pack.effective.status === 'known' && pack.effective.until && pack.effective.until < pack.effective.from!) errors.push('Reversed effective range');
  for (const rule of pack.rules) {
    if (rule.citations.some(c => !sources.has(c.source_id))) errors.push(`${rule.rule_id}: unknown citation source`);
    if (rule.status === 'executable') {
      try {
        const validator = engine().compile(rule.constraint!);
        if ('$async' in validator && validator.$async) errors.push(`${rule.rule_id}: asynchronous constraints unsupported`);
      } catch (error) { errors.push(`${rule.rule_id}: ${String(error)}`); }
    }
  }
  return { valid: errors.length === 0, errors };
}
/** Explicit constraint experiment. Rule outcomes do not imply applicability or readiness. */
export function evaluateSelectedPack(data: unknown, inputPack: unknown, selection?: Selection): EvaluationResult {
  const evidence = validateEvidence(data);
  const packResult = validateRulePack(inputPack);
  const result: EvaluationResult = { evidence, pack: packResult, applicability: 'unknown', coverage: 'partial', rules: [] };
  if (!evidence.valid || !packResult.valid) return result;
  const pack = inputPack as Pack;
  const asset = (data as { asset: { manufacturer: string; model: string; product_type: string } }).asset;
  if (asset.manufacturer !== pack.manufacturer || asset.product_type !== pack.product_scope.product_type || !pack.product_scope.models.includes(asset.model)
      || (selection?.jurisdiction !== undefined && selection.jurisdiction !== pack.jurisdiction)) {
    result.applicability = 'not_matched';
    return result;
  }
  if (selection?.jurisdiction === pack.jurisdiction && selection.date && pack.effective.status === 'known') {
    const dateValidator = ajv.compile({ type: 'string', format: 'date' });
    if (dateValidator(selection.date)) result.applicability = selection.date < pack.effective.from! || (pack.effective.until !== undefined && selection.date > pack.effective.until) ? 'not_matched' : 'matched';
  }
  if (result.applicability === 'not_matched') return result;
  result.rules = pack.rules.map(rule => {
    const base={rule_id:rule.rule_id,description:rule.description,citations:rule.citations.map(c=>({...c}))};
    if(rule.status==='unresolved')return {...base,status:'unresolved',errors:[rule.reason!]};
    const validate=engine().compile(rule.constraint!);
    const valid=validate(data);
    return {...base,status:valid?'satisfied':'unsatisfied',errors:(validate.errors??[]).map(e=>e.instancePath+': '+e.message)};
  });
  return result;
}
