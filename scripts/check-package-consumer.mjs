// SPDX-License-Identifier: MPL-2.0
// Run after extracting the local npm tarball into an isolated consumer.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
assert.equal(metadata.version, '0.1.0-draft.0');
assert.equal(metadata.private, true, 'Draft must remain protected from publication');
assert.equal(metadata.license, 'MPL-2.0');
assert.equal(metadata.dependencies, undefined, 'Schema-only artifact has no runtime dependencies');

const allowed = new Set([
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
assert.throws(() => requireFromConsumer.resolve('@proofgrid/core'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
assert.throws(() => requireFromConsumer.resolve('@proofgrid/core/schemas/9.9/evidence.schema.json'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
console.log('PASS isolated schema package exports, exact file inventory, source bytes and unsupported entry points');
