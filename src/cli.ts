#!/usr/bin/env node
// SPDX-License-Identifier: MPL-2.0
import {readFileSync,realpathSync,statSync} from 'node:fs';
import {dirname,resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateEvidence,validateRulePack} from './validate.js';
import {assessEvidence,type Report} from './report.js';
const help='ProofGrid: evidence structure and scoped claim-intake checks\n\nproofgrid validate --record FILE\nproofgrid check-pack --pack FILE\nproofgrid assess --record FILE (--pack FILE | --catalog FILE) [--jurisdiction LABEL] [--date YYYY-MM-DD] [--format json|text]\n\nExit codes: 0 checks met; 1 incomplete; 2 review required; 3 invalid input/usage.\nNo result is warranty approval. Inputs stay local; evidence URLs are never fetched.\n';
function readJson(file:string):unknown {
 if(statSync(file).size>5*1024*1024)throw Error('Input exceeds 5 MiB limit');
 return JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,''));
}
function loadCatalog(file:string):unknown[] {
 const catalog=readJson(file) as {catalog_version?:string;packs?:{pack?:string}[]};
 if(catalog.catalog_version!=='0.1'||!Array.isArray(catalog.packs)||!catalog.packs.length||catalog.packs.length>100)throw Error('Invalid or unsupported catalog');
 const root=realpathSync(dirname(resolve(file)));
 return catalog.packs.map(entry=>{
   if(typeof entry.pack!=='string'||isAbsolute(entry.pack))throw Error('Catalog pack must be a relative local path');
   const target=realpathSync(resolve(root,entry.pack)), rel=relative(root,target);
   if(rel.startsWith('..')||isAbsolute(rel))throw Error('Catalog path escapes its directory');
   return readJson(target);
 });
}
function textReport(report:Report):string {
 const lines=['ProofGrid: '+report.outcome,'Selection: '+report.selection];
 if(report.selected_pack)lines.push('Pack: '+report.selected_pack.pack_id+' @ '+report.selected_pack.pack_version);
 if(report.evaluation){lines.push('Applicability: '+report.evaluation.applicability);for(const r of report.evaluation.rules){lines.push('['+r.status+'] '+r.rule_id+': '+r.description);for(const e of r.errors??[])lines.push('  '+e);for(const c of r.citations??[])lines.push('  Source: '+c.source_id+' / '+c.locator);}}
 for(const finding of report.findings)lines.push('['+finding.code+'] '+finding.path+': '+finding.message);
 lines.push(...report.limitations.map(l=>'Limit: '+l));return lines.join('\n');
}
export function runCli(args:string[],write:(text:string)=>void=console.log):number {
 try {
  if(!args.length||args[0]==='--help'){write(help);return 0;}
  const command=args[0];if(!['validate','check-pack','assess'].includes(command!))throw Error('Unknown command');
  const options:Record<string,string>={};
  for(let i=1;i<args.length;i+=2){const key=args[i]!,value=args[i+1];if(!['--record','--pack','--catalog','--jurisdiction','--date','--format'].includes(key)||value===undefined||value.startsWith('--')||options[key]!==undefined)throw Error('Unknown, duplicate or incomplete option: '+key);options[key]=value;}
  const format=options['--format']??'json';if(!['json','text'].includes(format))throw Error('Format must be json or text');
  if(command==='validate'||command==='check-pack'){
   const key=command==='validate'?'--record':'--pack';if(!options[key]||Object.keys(options).some(k=>k!==key&&k!=='--format'))throw Error('Unexpected or missing validation option');
   const result=(command==='validate'?validateEvidence:validateRulePack)(readJson(options[key]));write(JSON.stringify(result,null,2));return result.valid?0:3;
  }
  if(!options['--record']||Boolean(options['--pack'])===Boolean(options['--catalog']))throw Error('Assess requires --record and exactly one of --pack or --catalog');
  const packs=options['--pack']?[readJson(options['--pack'])]:loadCatalog(options['--catalog']!);
  const selection=options['--jurisdiction']?{jurisdiction:options['--jurisdiction'],date:options['--date']}:undefined;
  if(options['--date']&&!selection)throw Error('--date requires --jurisdiction');
  const report=assessEvidence(readJson(options['--record']),packs,selection);
  write(format==='text'?textReport(report):JSON.stringify(report,null,2));return {scoped_checks_met:0,incomplete:1,review_required:2,invalid:3}[report.outcome];
 } catch(error){write(JSON.stringify({outcome:'invalid',error:error instanceof Error?error.message:String(error)}));return 3;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)process.exitCode=runCli(process.argv.slice(2));
