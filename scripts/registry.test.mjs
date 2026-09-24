// Pure pieces of the registry reader. Network calls are not tested here; `CI=true npm run build`
// exercises them against the live registries.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isEsmOnly, byNewest, npmReadme } from './registry.mjs';

test('isEsmOnly: type module with ESM exports passes', () => {
  assert.equal(isEsmOnly({ type: 'module', exports: { '.': { import: './dist/index.js', types: './dist/index.d.ts' } } }), true);
});

test('isEsmOnly: no type module is CJS', () => {
  assert.equal(isEsmOnly({ main: './index.js' }), false);
});

test('isEsmOnly: dual package is rejected', () => {
  assert.equal(isEsmOnly({ type: 'module', exports: { '.': { import: './index.js', require: './index.cjs' } } }), false);
});

test('isEsmOnly: a .cjs anywhere in exports or main is rejected', () => {
  assert.equal(isEsmOnly({ type: 'module', exports: { './legacy': './legacy.cjs' } }), false);
  assert.equal(isEsmOnly({ type: 'module', main: './index.cjs' }), false);
});

test('byNewest: releases outrank their prereleases, betas order numerically', () => {
  assert.deepEqual(byNewest(['26.9.0-beta.2', '26.9.0', '26.9.0-beta.10', '26.8.1']), [
    '26.9.0',
    '26.9.0-beta.10',
    '26.9.0-beta.2',
    '26.8.1',
  ]);
});

test('npmReadme: npm placeholder means no README', () => {
  assert.equal(npmReadme({ readme: 'ERROR: No README data found!' }), '');
  assert.equal(npmReadme({}), '');
  assert.equal(npmReadme({ readme: '# hi' }), '# hi');
});
