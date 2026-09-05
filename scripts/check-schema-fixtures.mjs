// SPDX-License-Identifier: MPL-2.0
// Usage: node scripts/check-schema-fixtures.mjs emit|verify <suite.json>
// Pipe emit through an installed VS Code JSON server (--stdio), then into verify.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { encode, decode } from '../test/support/language-server.mjs';

const [mode, suitePath] = process.argv.slice(2);
assert.ok(['emit', 'verify'].includes(mode) && suitePath, 'Expected emit|verify and a fixture suite path');
const suite = JSON.parse(readFileSync(suitePath, 'utf8'));
const schema = JSON.parse(readFileSync(resolve(dirname(suitePath), suite.schema), 'utf8'));
assert.ok(schema.$id && suite.cases.length, 'A schema ID and nonempty cases are required');
const target = suite.constraint
  ? { ...schema, $id: schema.$id + ':test-constraint', allOf: [...(schema.allOf ?? []), suite.constraint] }
  : schema;

if (mode === 'emit') {
  const send = message => process.stdout.write(encode(message));
  send({ id: 1, method: 'initialize', params: { processId: null, rootUri: null, capabilities: {}, initializationOptions: { handledSchemaProtocols: ['http', 'https', 'urn', 'file', 'vscode'] } } });
  send({ method: 'initialized', params: {} });
  const schemas = target === schema ? [schema] : [schema, target];
  send({ method: 'workspace/didChangeConfiguration', params: { settings: { json: {
    validate: { enable: true, schemaValidation: 'error', schemaRequest: 'error' },
    schemas: schemas.map(item => ({ url: item.$id, schema: item })),
  } } } });
  suite.cases.forEach((item, index) => send({ id: index + 2, method: 'json/validateContent', params: { schemaUri: target.$id, content: JSON.stringify(item.data) } }));
  // EOF makes the server exit immediately. Give in-memory requests time to finish.
  // verify fails closed if any response is missing; this delay cannot fake a pass.
  await new Promise(resolve => setTimeout(resolve, 3000));
} else {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const messages = decode(Buffer.concat(chunks));
  assert.ok(messages.some(message => message.id === 1 && message.result?.capabilities), 'Server did not initialize');
  // External schema requests are prohibited. A missing schema must fail this run.
  assert.ok(!messages.some(message => message.method === 'vscode/content'), 'Server requested an external schema');
  const results = new Map();
  for (const message of messages) {
    if (message.id !== undefined && !message.method) {
      assert.ok(!message.error, JSON.stringify(message.error));
      assert.ok(!results.has(message.id), 'Duplicate server response');
      results.set(message.id, message.result);
    }
  }
  for (const [index, item] of suite.cases.entries()) {
    const diagnostics = results.get(index + 2);
    assert.ok(Array.isArray(diagnostics), 'Missing response for ' + item.name);
    assert.ok(!diagnostics.some(diagnostic => /unable to load|resolve reference|unsupported|not supported/i.test(diagnostic.message)), 'Resolver/dialect failure: ' + JSON.stringify(diagnostics));
    assert.equal(diagnostics.length === 0, item.valid, item.name + ': ' + JSON.stringify(diagnostics));
    console.log('PASS ' + item.name);
  }
  console.log(`${suite.cases.length} fixture assertions passed using the supplied JSON language server. This is not an Ajv/runtime/typecheck result.`);
}
