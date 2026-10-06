/**
 * Offline checks for the pure model code (no app needed): rail layout merge,
 * look-file normalization across 0.2 / 0.3 / current formats, the poster SVG,
 * and the short-name wrap. Run with `npm test`.
 *
 * Run from the repository root (npm test does). These replace the throwaway
 * /tmp scripts used during the 2026-09-20 and 2026-09-23 sessions
 * (pt-check.ts, pt-wrap.ts, pt-layout.ts).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeRailLayout, normalizeLook, type RailEntry } from '../src/types';
import { posterSvg, wrapTitle } from '../src/poster';

let n = 0;
const ok = (m: string) => { n++; console.log('PASS', m); };

// ---- mergeRailLayout: deleted dividers stay deleted, closed projects are carried over
const saved: RailEntry[] = [
  { kind: 'project', path: '/a' },
  { kind: 'rule', id: 'r1' },
  { kind: 'text', id: 't1', label: 'Work' },
  { kind: 'project', path: '/b' },
  { kind: 'project', path: '/closed' },
];
const without = (id: string) => saved.filter((e) => e.kind === 'project' ? e.path !== '/closed' : e.id !== id);
assert.deepEqual(mergeRailLayout(without('r1'), saved).map((e) => e.kind), ['project', 'text', 'project', 'project']); ok('deleting a rule removes it');
assert.deepEqual(mergeRailLayout(without('t1'), saved).map((e) => e.kind), ['project', 'rule', 'project', 'project']); ok('deleting a heading removes it');
const reordered: RailEntry[] = [{ kind: 'project', path: '/b' }, { kind: 'rule', id: 'r1' }, { kind: 'text', id: 't1', label: 'Work' }, { kind: 'project', path: '/a' }];
const merged = mergeRailLayout(reordered, saved);
assert.deepEqual(merged.slice(0, 4), reordered); assert.deepEqual(merged[4], { kind: 'project', path: '/closed' }); ok('reorder keeps the closed project at the end');

// ---- normalizeLook: a sample 0.3-era look file
const sample = normalizeLook(JSON.parse(readFileSync('tests/fixtures/project-theme.json', 'utf8')));
assert.equal(sample.version, 1); assert.equal(sample.themeId, 'grove-dark-juicy'); assert.equal(sample.shortName, 'Sandbox');
assert.deepEqual(sample.poster.palette, { primary: '#1e293b', accent: '#10b981', text: '#ffffff' });
assert.equal(sample.poster.openFolderButton, true); assert.equal(sample.poster.show, true); ok('sample look file normalizes');

// ---- normalizeLook: a 0.2 file maps onto the current model
const v02 = normalizeLook({
  shortName: 'Old', icon: { kind: 'emoji', emoji: 'x' }, tile: { kind: 'auto' },
  poster: { source: 'none', shape: 'diagonal-shadow', palette: { from: '#000000', to: '#ffffff', gradient: true }, title: { color: 'auto', show: true } },
});
assert.equal(v02.poster.shape, 'diagonal'); assert.equal(v02.poster.show, false); assert.deepEqual(v02.icon, { kind: 'initials' });
assert.deepEqual(v02.tile, { kind: 'gradient', from: '#000000', to: '#ffffff', angle: 135 });
assert.equal(v02.poster.palette.text, '#111827'); ok('0.2 file: diagonal-shadow, source none, emoji icon, auto tile, auto text');

// ---- posterSvg: solid fills only, text in the palette's text color
const svg = posterSvg(sample.poster, { title: 'Sandbox', aspect: 'banner' });
assert.ok(!svg.includes('linearGradient')); assert.ok(svg.includes('fill="#1e293b"')); assert.ok(svg.includes('fill="#ffffff"'));
assert.ok(svg.includes('viewBox="0 0 400 225"')); ok('banner SVG: no gradient, palette fills, 16:9');

// ---- wrapTitle: at most two lines, break after hyphens or at spaces, ellipsis on overflow
assert.deepEqual(wrapTitle('Sandbox', 40, 352), ['Sandbox']);
assert.deepEqual(wrapTitle('UX-review-checklist', 40, 352), ['UX-review-', 'checklist']);
assert.deepEqual(wrapTitle('Field Notes Q3 partner review board', 40, 352), ['Field Notes Q3', 'partner review…']); ok('short-name wrap');

console.log(`\n${n} passed`);
