// Pure pieces of the registry reader. Network calls are not tested here; `CI=true npm run build`
// exercises them against the live registries.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isEsmOnly, byNewest, npmReadme, publishedVersions } from './registry.mjs';
import { cleanReadme } from './readme.mjs';

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

const BASE = 'https://jsr.io/@green-tea/jwt/26.9.0-beta.0/';

test('cleanReadme: strips scripts, handlers and javascript: links', () => {
  const html = cleanReadme('<script>alert(1)</script><img src="x.png" onerror="x()"><a href="javascript:x()">a</a>', BASE);
  assert.doesNotMatch(html, /script|onerror|javascript:/);
});

test('cleanReadme: keeps align and width (our READMEs center the logo)', () => {
  const html = cleanReadme('<p align="center"><img src="https://x.io/l.png" width="96" alt="l"></p>', BASE);
  assert.match(html, /<p align="center">/);
  assert.match(html, /width="96"/);
});

test('cleanReadme: relative links and images point at the published version', () => {
  const html = cleanReadme('<a href="./docs/a.md">a</a><img src="assets/l.png">', BASE);
  assert.match(html, /href="https:\/\/jsr\.io\/@green-tea\/jwt\/26\.9\.0-beta\.0\/docs\/a\.md"/);
  assert.match(html, /src="https:\/\/jsr\.io\/@green-tea\/jwt\/26\.9\.0-beta\.0\/assets\/l\.png"/);
  const npm = cleanReadme('<img src="./l.png">', 'https://cdn.jsdelivr.net/npm/green-tea-foo@1.0.0/');
  assert.match(npm, /src="https:\/\/cdn\.jsdelivr\.net\/npm\/green-tea-foo@1\.0\.0\/l\.png"/);
});

test('cleanReadme: leaves anchors alone', () => {
  assert.match(cleanReadme('<a href="#install">i</a>', BASE), /href="#install"/);
});

test('cleanReadme: styles — shiki colours stay, layout tricks go', () => {
  const html = cleanReadme(
    '<pre class="astro-code" style="background-color:#24292e;overflow-x:auto"><span style="color:#F97583">x</span></pre><div style="position:fixed;inset:0">y</div>',
    BASE,
  );
  assert.match(html, /color:#F97583/);
  assert.match(html, /background-color:#24292e/);
  assert.doesNotMatch(html, /position|inset/);
});

test('cleanReadme: an <a> without href does not become a link', () => {
  const html = cleanReadme('<a name="x">t</a><img alt="n">', BASE);
  assert.doesNotMatch(html, /href|src/);
});

test('cleanReadme: our own class names cannot be borrowed, shiki ones stay', () => {
  const html = cleanReadme(
    '<span class="card__link">x</span><span class="version">y</span><pre class="astro-code github-dark"><code class="language-ts"><span class="line">z</span></code></pre>',
    BASE,
  );
  assert.doesNotMatch(html, /card__link|class="version"/);
  assert.match(html, /class="astro-code github-dark"/);
  assert.match(html, /class="line"/);
  assert.match(html, /class="language-ts"/);
});

test('cleanReadme: <source srcset> points at the published version, descriptors kept', () => {
  const html = cleanReadme('<picture><source media="(prefers-color-scheme: dark)" srcset="docs/dark.svg, docs/dark@2x.svg 2x"><img src="docs/l.svg"></picture>', BASE);
  assert.match(html, /srcset="https:\/\/jsr\.io\/@green-tea\/jwt\/26\.9\.0-beta\.0\/docs\/dark\.svg, https:\/\/jsr\.io\/@green-tea\/jwt\/26\.9\.0-beta\.0\/docs\/dark@2x\.svg 2x"/);
});

test('publishedVersions: yanked JSR versions are not listed', () => {
  assert.deepEqual(publishedVersions([{ version: '1.0.0', yanked: false }, { version: '1.0.1', yanked: true }]), ['1.0.0']);
});
