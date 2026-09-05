// SPDX-License-Identifier: MPL-2.0
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {assessEvidence,inspectReferences} from '../dist/src/index.js';import {runCli} from '../dist/src/cli.js';
const read=name=>JSON.parse(readFileSync(new URL('./fixtures/'+name+'.json',import.meta.url)));
const pack=read('rule-pack-cases').cases[0].data,record=read('purchase-constraint-cases').cases[1].data;
test('scoped success requires known date and resolved rules',()=>{const p=structuredClone(pack);p.effective={status:'known',from:'2026-01-01'};assert.equal(assessEvidence(record,[p],{jurisdiction:'example',date:'2026-09-05'}).outcome,'scoped_checks_met');assert.equal(assessEvidence(record,[p]).outcome,'review_required');});
test('empty, conflicting and malformed catalogs never pass',()=>{assert.equal(assessEvidence(record,[]).selection,'none');assert.equal(assessEvidence(record,[pack,pack]).selection,'ambiguous');assert.equal(assessEvidence(record,[{}]).outcome,'invalid');});
test('missing evidence yields incomplete with useful errors',()=>{const result=assessEvidence(read('purchase-constraint-cases').cases[0].data,[pack]);assert.equal(result.outcome,'incomplete');assert.ok(result.evaluation.rules[0].errors.length);});
test('invalid records fail before selection',()=>assert.equal(assessEvidence({},[]).outcome,'invalid'));
test('report does not mutate record or pack',()=>{const before=structuredClone({record,pack});assessEvidence(record,[pack]);assert.deepEqual({record,pack},before);});
for(const [name,mutate,code] of [
 ['dangling invoice',d=>d.purchase.proof_of_purchase=['absent'],'dangling_reference'],
 ['duplicate evidence',d=>d.evidence.push(structuredClone(d.evidence[0])),'duplicate_id'],
 ['revoked evidence',d=>d.evidence[0].state='revoked','unavailable_evidence'],
 ['empty present evidence',d=>delete d.evidence[0].content_ref,'unavailable_evidence'],
 ['unverified evidence',d=>d.evidence[0].state='unverified','uncertain_evidence'],
 ['unknown seller',d=>d.purchase.seller_ref='missing','dangling_reference'],
 ['supersession cycle',d=>{d.evidence[0].state='superseded';d.evidence[0].superseded_by=d.evidence[0].evidence_id;},'supersession_cycle']
])test(name,()=>{const d=structuredClone(record);mutate(d);assert.ok(inspectReferences(d).some(f=>f.code===code));assert.notEqual(assessEvidence(d,[pack]).outcome,'scoped_checks_met');});
test('unknown authorization is not inferred from presence',()=>{const d=structuredClone(record);d.actors=[{actor_id:'tech',role:'technician'}];d.service_events=[{event_id:'repair',event_type:'repair',asset_ref:d.asset.asset_id,actor_ref:'tech',state:'present',authorization:{state:'unknown',actor_ref:'tech',manufacturer:'example',role:'repair'}}];assert.ok(inspectReferences(d).some(f=>f.code==='uncertain_authorization'));});
test('scope mismatch returns no misleading failures from wrong rules',()=>{const p=structuredClone(pack);p.manufacturer='other';const r=assessEvidence(record,[p]);assert.equal(r.selection,'none');assert.equal(r.evaluation,undefined);});
mkdirSync(new URL('../.local-checks/',import.meta.url),{recursive:true});
const temp=mkdtempSync(new URL('../.local-checks/cli-',import.meta.url));const rp=join(temp,'record.json'),pp=join(temp,'pack.json');writeFileSync(rp,JSON.stringify(record));writeFileSync(pp,JSON.stringify(pack));
for(const [args,code] of [[['--help'],0],[['unknown'],3],[['validate','--record',rp],0],[['check-pack','--pack',pp],0],[['assess','--record',rp,'--pack',pp],2],[['assess','--record',rp,'--pack',pp,'--format','text'],2],[['assess','--record',rp,'--pack',pp,'--date','2026-09-05'],3],[['validate','--record',rp,'--record',rp],3]])test('CLI '+args.join(' '),()=>{const output=[];assert.equal(runCli(args,x=>output.push(x)),code);assert.equal(output.length,1);});
test('catalog cannot escape its directory',()=>{writeFileSync(join(temp,'catalog.json'),JSON.stringify({catalog_version:'0.1',packs:[{pack:'../../package.json'}]}));let out;assert.equal(runCli(['assess','--record',rp,'--catalog',join(temp,'catalog.json')],x=>out=x),3);assert.match(out,/escapes/);});
