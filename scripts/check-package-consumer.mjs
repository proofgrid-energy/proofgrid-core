// SPDX-License-Identifier: MPL-2.0
// Run after extracting the local npm tarball into an isolated consumer.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const consumer = process.argv[2];
assert.ok(consumer, 'Usage: node scripts/check-package-consumer.mjs CONSUMER_DIRECTORY');
const root = resolve(consumer);
const requireFromConsumer = createRequire(pathToFileURL(join(root, 'consumer.cjs')));
const packageRoot = join(root, 'node_modules', '@proofgrid', 'core');
const metadata = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
assert.equal(metadata.name, '@proofgrid/core');
assert.equal(metadata.version, '0.2.0-draft.0');
assert.equal(metadata.private, true, 'Draft must remain protected from publication');
assert.equal(metadata.license, 'MPL-2.0');
assert.deepEqual(metadata.dependencies, {ajv: '8.20.0', 'ajv-formats': '3.0.1'});

const allowed = new Set([
  'dist/src/report.js', 'dist/src/report.d.ts', 'dist/src/cli.js', 'dist/src/cli.d.ts',
  'dist/src/index.js', 'dist/src/index.d.ts', 'dist/src/validate.js', 'dist/src/validate.d.ts',
  'dist/schemas/0.1/evidence.schema.json', 'dist/schemas/0.1/rule-pack.schema.json',
  'package.json', 'README.md', 'LICENSE', 'LICENSING.md', 'LICENSES/Apache-2.0.txt',
  'docs/contracts.md', 'docs/standards-mapping.md',
  'schemas/0.1/evidence.schema.json', 'schemas/0.1/rule-pack.schema.json',
]);
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Package must not contain symbolic links');
    if (entry.isDirectory()) inspect(path);
    else assert.ok(allowed.delete(relative(packageRoot, path).replaceAll('\\', '/')), `Unexpected package file: ${path}`);
  }
}
inspect(packageRoot);
assert.equal(allowed.size, 0, `Missing package files: ${[...allowed].join(', ')}`);
for (const name of ['evidence', 'rule-pack']) {
  const subpath = `schemas/0.1/${name}.schema.json`;
  const resolved = requireFromConsumer.resolve(`@proofgrid/core/${subpath}`);
  assert.equal(resolved, join(packageRoot, subpath));
  const bytes = readFileSync(resolved);
  assert.deepEqual(bytes, readFileSync(new URL(`../${subpath}`, import.meta.url)), 'Packed schema must equal source bytes');
  assert.equal(JSON.parse(bytes).$id, `urn:proofgrid:schema:${name}:0.1`);
}
const entry = join(packageRoot, 'dist/src/index.js');
writeFileSync(join(root, 'smoke.mjs'), "export * from '@proofgrid/core';\nexport const resolved = import.meta.resolve('@proofgrid/core');\n");
const { validateEvidence, evaluateSelectedPack, resolved: runtimeResolved } = await import(pathToFileURL(join(root, 'smoke.mjs')));
assert.equal(runtimeResolved, pathToFileURL(entry).href);
for (const name of ['evidence', 'rule-pack']) assert.deepEqual(
  JSON.parse(readFileSync(join(packageRoot, 'dist/schemas/0.1/' + name + '.schema.json'))),
  JSON.parse(readFileSync(join(packageRoot, 'schemas/0.1/' + name + '.schema.json'))));
const sample = JSON.parse(readFileSync(new URL('../examples/minimal-evidence.json', import.meta.url)));
assert.equal(validateEvidence(sample).valid, true);
assert.equal(validateEvidence({...sample, schema_version:'9.9'}).valid, false);
const pack = JSON.parse(readFileSync(new URL('../test/fixtures/rule-pack-cases.json', import.meta.url))).cases[0].data;
const fixture = JSON.parse(readFileSync(new URL('../test/fixtures/purchase-constraint-cases.json', import.meta.url))).cases[0].data;
assert.equal(evaluateSelectedPack(fixture, pack).rules[0].status, 'unsatisfied');
assert.equal(metadata.exports['.'].import, './dist/src/index.js');
assert.equal(metadata.exports['.'].types, './dist/src/index.d.ts');
assert.throws(() => requireFromConsumer.resolve('@proofgrid/core/schemas/9.9/evidence.schema.json'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
console.log('PASS isolated runtime and schema package, exact inventory, source bytes and unsupported schema version');

assert.equal(metadata.bin.proofgrid, './dist/src/cli.js');
assert.ok(readFileSync(entry.replace('index.js','cli.js'),'utf8').startsWith('#!/usr/bin/env node'));
const cli = await import(pathToFileURL(entry.replace('index.js','cli.js')));
assert.equal(cli.runCli(['--help'],()=>{}),0);
