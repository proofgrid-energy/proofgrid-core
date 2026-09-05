// SPDX-License-Identifier: MPL-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateEvidence, validateRulePack, evaluateSelectedPack } from '../dist/src/index.js';
const read = name => JSON.parse(readFileSync(new URL('./fixtures/' + name + '.json', import.meta.url)));
for (const [name, validate] of [['evidence-cases', validateEvidence], ['rule-pack-cases', validateRulePack]]) {
  for (const fixture of read(name).cases) test(fixture.name, () => {
    const before = structuredClone(fixture.data);
    assert.equal(validate(fixture.data).valid, fixture.valid, JSON.stringify(validate(fixture.data)));
    assert.deepEqual(fixture.data, before);
  });
}
const pack = read('rule-pack-cases').cases[0].data;
const purchase = read('purchase-constraint-cases');
for (const fixture of purchase.cases) test(fixture.name, () => {
  const before = structuredClone(fixture.data);
  const result = evaluateSelectedPack(fixture.data, pack, {jurisdiction: 'example'});
  assert.equal(result.evidence.valid, true);
  assert.equal(result.pack.valid, true);
  assert.equal(result.applicability, 'unknown');
  assert.equal(result.rules[0].status, fixture.valid ? 'satisfied' : 'unsatisfied');
  assert.deepEqual(fixture.data, before);
});
const data = purchase.cases[1].data;
for (const [name, mutate] of [
 ['unsupported version', p => p.schema_version = '9.9'],
 ['unknown source', p => p.rules[0].citations[0].source_id = 'missing'],
 ['duplicate source', p => p.sources.push(p.sources[0])],
 ['duplicate rule', p => p.rules.push(p.rules[0])],
 ['unknown keyword', p => p.rules[0].constraint = {madeUp: true}],
 ['invalid keyword value', p => p.rules[0].constraint = {type: 2}],
 ['external reference', p => p.rules[0].constraint = {$ref: 'https://example.com/not-fetched'}],
 ['asynchronous schema', p => p.rules[0].constraint = {$async: true, type: 'object'}],
 ['reverse dates', p => p.effective = {status: 'known', from: '2026-09-05', until: '2025-01-01'}]
]) test('reject ' + name, () => {
  const p = structuredClone(pack); mutate(p);
  assert.equal(validateRulePack(p).valid, false);
  assert.deepEqual(evaluateSelectedPack(data, p).rules, []);
});
test('explicit jurisdiction and product mismatch prevent evaluation', () => {
  assert.equal(evaluateSelectedPack(data, pack, {jurisdiction: 'other'}).applicability, 'not_matched');
  for (const key of ['manufacturer','model','product_type']) {
    const d = structuredClone(data); d.asset[key] = 'other';
    assert.deepEqual(evaluateSelectedPack(d, pack).rules, []);
  }
});
test('date selection never substitutes source review date', () => {
  const p = structuredClone(pack); p.effective = {status: 'known', from: '2026-01-01', until: '2026-12-31'};
  for (const [date, expected] of [[undefined,'unknown'],['2026-02-30','unknown'],['2026-09-05','matched'],['2027-01-01','not_matched'],['2025-12-31','not_matched']]) {
    assert.equal(evaluateSelectedPack(data,p,{jurisdiction:'example',date}).applicability, expected);
  }
  assert.equal(evaluateSelectedPack(data,p).applicability,'unknown');
});
test('unresolved rule remains unresolved and both inputs remain unchanged', () => {
  const p = structuredClone(pack); p.rules[0].status='unresolved'; p.rules[0].reason='Conflicting source'; delete p.rules[0].constraint;
  const before=structuredClone(p);
  assert.equal(evaluateSelectedPack(data,p).rules[0].status,'unresolved');
  assert.deepEqual(p,before);
});
test('locally registered evidence URN resolves', () => {
  const p=structuredClone(pack); p.rules[0].constraint={$ref:'urn:proofgrid:schema:evidence:0.1'};
  assert.equal(evaluateSelectedPack(data,p).rules[0].status,'satisfied');
});
