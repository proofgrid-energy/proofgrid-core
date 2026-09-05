// SPDX-License-Identifier: MPL-2.0
import {validateEvidence, validateRulePack, evaluateSelectedPack, type Selection, type EvaluationResult} from './validate.js';
export interface Finding {code: string; path: string; message: string}
export interface Report {
  report_version: '0.1'; outcome: 'invalid' | 'incomplete' | 'review_required' | 'scoped_checks_met';
  selection: 'selected' | 'none' | 'ambiguous' | 'invalid_catalog';
  selected_pack?: {pack_id:string; pack_version:string};
  candidates: {pack_id:string; pack_version:string; applicability:string}[];
  evaluation?: EvaluationResult; findings: Finding[]; limitations: string[];
}
interface Evidence {evidence_id:string; state:string; content_ref?:string; measurement?:unknown; superseded_by?:string}
interface Asset {asset_id:string; manufacturer:string; serial_number?:string; specification_evidence?:string[]}
interface Actor {actor_id:string}
interface Auth {state:string; actor_ref:string; authorizing_actor_ref?:string; manufacturer:string; evidence?:string[]; valid_from?:string; valid_until?:string}
interface Provenance {issuer_ref:string; status:string}
interface Event {event_id:string; asset_ref:string; actor_ref?:string; authorization?:Auth; evidence?:string[]; provenance?:Provenance}
interface Replacement {event_id:string; previous_asset:Asset; replacement_asset:Asset; service_event_ref?:string; authorization?:Auth}
interface RecordData {
 asset:Asset; evidence?:Evidence[]; actors?:Actor[]; system_configuration?:{components?:Asset[]};
 purchase?:{seller_ref?:string; proof_of_purchase?:string[]}; installation?:{installer_ref?:string; evidence?:string[]};
 fault?:{evidence?:string[]}; diagnostics?:{logs?:string[]}; service_events?:Event[]; replacement_events?:Replacement[]; provenance?:Provenance;
}
/** In-record links only. Off-chain content and cross-record references are never fetched. */
export function inspectReferences(input:unknown): Finding[] {
 if(!validateEvidence(input).valid) return [{code:'invalid_record',path:'',message:'Validate record structure before inspecting links'}];
 const data=input as RecordData, findings:Finding[]=[];
 const add=(code:string,path:string,message:string)=>findings.push({code,path,message});
 const unique=(items:{id:string}[],path:string)=>{const ids=new Set<string>();for(const item of items){if(ids.has(item.id))add('duplicate_id',path,'Duplicate identifier: '+item.id);ids.add(item.id);}return ids;};
 const evidence=data.evidence??[], actors=data.actors??[], events=data.service_events??[], replacements=data.replacement_events??[];
 unique(evidence.map(e=>({id:e.evidence_id})),'/evidence');
 const actorIds=unique(actors.map(a=>({id:a.actor_id})),'/actors');
 unique([...events,...replacements].map(e=>({id:e.event_id})),'/events');
 const assets=[data.asset,...(data.system_configuration?.components??[])];
 unique(assets.map(a=>({id:a.asset_id})),'/assets');
 const assetIds=new Set([...assets,...replacements.flatMap(r=>[r.previous_asset,r.replacement_asset])].map(a=>a.asset_id));
 const byEvidence=new Map(evidence.map(e=>[e.evidence_id,e]));
 const ref=(id:string|undefined,ids:Set<string>,path:string)=>{if(id!==undefined&&!ids.has(id))add('dangling_reference',path,'Unknown target: '+id);};
 const evidenceRefs=(ids:string[]|undefined,path:string)=>{for(const id of ids??[]){const e=byEvidence.get(id);if(!e){add('dangling_reference',path,'Unknown evidence: '+id);continue;}if(!['present','verified','unverified'].includes(e.state))add('unavailable_evidence',path,id+' is '+e.state);else if(!e.content_ref&&!e.measurement)add('unavailable_evidence',path,id+' has no content reference or measurement');if(e.state==='unverified')add('uncertain_evidence',path,id+' remains unverified');}};
 const auth=(a:Auth|undefined,path:string)=>{if(!a)return;ref(a.actor_ref,actorIds,path+'/actor_ref');ref(a.authorizing_actor_ref,actorIds,path+'/authorizing_actor_ref');evidenceRefs(a.evidence,path+'/evidence');if(a.state==='unauthorized')add('unauthorized',path,'Authorization explicitly denied');else if(!['verified','not_required'].includes(a.state))add('uncertain_authorization',path,'Authorization remains '+a.state);if(a.valid_from&&a.valid_until&&Date.parse(a.valid_until)<Date.parse(a.valid_from))add('invalid_authorization_range',path,'Authorization validity range is reversed');};
 for(const a of assets)evidenceRefs(a.specification_evidence,'/assets/'+a.asset_id+'/specification_evidence');
 ref(data.purchase?.seller_ref,actorIds,'/purchase/seller_ref');evidenceRefs(data.purchase?.proof_of_purchase,'/purchase/proof_of_purchase');
 ref(data.installation?.installer_ref,actorIds,'/installation/installer_ref');evidenceRefs(data.installation?.evidence,'/installation/evidence');
 evidenceRefs(data.fault?.evidence,'/fault/evidence');evidenceRefs(data.diagnostics?.logs,'/diagnostics/logs');
 for(const e of events){ref(e.asset_ref,assetIds,'/service_events/'+e.event_id);ref(e.actor_ref,actorIds,'/service_events/'+e.event_id+'/actor_ref');evidenceRefs(e.evidence,'/service_events/'+e.event_id+'/evidence');auth(e.authorization,'/service_events/'+e.event_id+'/authorization');if(e.authorization&&e.actor_ref&&e.authorization.actor_ref!==e.actor_ref)add('authorization_actor_mismatch','/service_events/'+e.event_id,'Event and authorization actors differ');}
 for(const r of replacements){if(r.previous_asset.asset_id===r.replacement_asset.asset_id)add('self_replacement','/replacement_events/'+r.event_id,'Replacement must identify a different asset');ref(r.service_event_ref,new Set(events.map(e=>e.event_id)),'/replacement_events/'+r.event_id+'/service_event_ref');auth(r.authorization,'/replacement_events/'+r.event_id+'/authorization');}
 for(const e of evidence){const seen=new Set<string>();let next:Evidence|undefined=e;while(next?.superseded_by){if(seen.has(next.evidence_id)){add('supersession_cycle','/evidence/'+e.evidence_id,'Evidence supersession cycle');break;}seen.add(next.evidence_id);const target=byEvidence.get(next.superseded_by);if(!target){add('dangling_reference','/evidence/'+next.evidence_id+'/superseded_by','Unknown replacement evidence');break;}next=target;}}
 return findings;
}
export function assessEvidence(input:unknown, packs:unknown[], selection?:Selection):Report {
 const report:Report={report_version:'0.1',outcome:'review_required',selection:'none',candidates:[],findings:[],limitations:['Scoped evidence checks only; not warranty approval or physical verification','Unknown applicability and unresolved rules require human review','Evidence contents, issuer authority and cross-record history are not verified']};
 const structural=validateEvidence(input);
 if(!structural.valid){report.outcome='invalid';report.findings=structural.errors.map(message=>({code:'invalid_record',path:'',message}));return report;}
 const validPacks=packs.map(pack=>validateRulePack(pack));
 if(validPacks.some(result=>!result.valid)){report.outcome='invalid';report.selection='invalid_catalog';report.findings=validPacks.flatMap((r,i)=>r.errors.map(message=>({code:'invalid_pack',path:'/packs/'+i,message})));return report;}
 const evaluated=packs.map(pack=>({pack:pack as {pack_id:string;pack_version:string;limitations:string[]},result:evaluateSelectedPack(input,pack,selection)}));
 const candidates=evaluated.filter(item=>item.result.applicability!=='not_matched');
 report.candidates=candidates.map(({pack,result})=>({pack_id:pack.pack_id,pack_version:pack.pack_version,applicability:result.applicability}));
 report.findings=inspectReferences(input);
 if(report.findings.some(f=>['duplicate_id','dangling_reference','self_replacement','supersession_cycle','authorization_actor_mismatch','invalid_authorization_range'].includes(f.code))) report.outcome='invalid';
 if(candidates.length!==1){report.selection=candidates.length?'ambiguous':'none';report.findings.push({code:candidates.length?'ambiguous_selection':'no_matching_pack',path:'/packs',message:candidates.length?'Multiple candidate packs; choose an explicit version after source review':'No matching pack; do not interpret absence as readiness'});return report;}
 const {pack,result}=candidates[0]!;report.selection='selected';report.selected_pack={pack_id:pack.pack_id,pack_version:pack.pack_version};report.evaluation=result;report.limitations.push(...pack.limitations);
 if(report.findings.some(f=>['duplicate_id','dangling_reference','self_replacement','supersession_cycle','authorization_actor_mismatch','invalid_authorization_range'].includes(f.code)))report.outcome='invalid';
 else if(result.rules.some(r=>r.status==='unsatisfied')||report.findings.some(f=>f.code==='unavailable_evidence'||f.code==='unauthorized'))report.outcome='incomplete';
 else if(result.applicability==='matched'&&!result.rules.some(r=>r.status==='unresolved')&&report.findings.length===0)report.outcome='scoped_checks_met';
 return report;
}
