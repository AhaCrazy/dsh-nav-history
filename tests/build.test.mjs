import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { loadBundle } from './support.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('client.js is generated from src/ and up to date', () => {
  const output = execFileSync(process.execPath, ['scripts/build.mjs', '--check'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.match(output, /up to date/);
});

test('the generated bundle registers the client module without ESM syntax', () => {
  const { registration, plugin, source } = loadBundle();
  assert.equal(registration.id, 'dsh-nav-history');
  assert.equal(plugin.name, 'dsh-nav-history');
  assert.deepEqual(plugin.inject, ['slots', 'locale', 'layout', 'uiWorkspace', 'sessions', 'shortcuts']);
  assert.equal(typeof plugin.apply, 'function');
  assert.equal(typeof plugin.internals.createNavHistory, 'function');
  assert.match(source, /shell\.bottom/);
  assert.match(source, /nav-history\.back/);
  assert.match(source, /nav-history\.forward/);
  // The client loader evaluates a plain script, not a module.
  assert.doesNotMatch(source, /^import\s/m);
  assert.doesNotMatch(source, /^\s*export\s/m);
});
