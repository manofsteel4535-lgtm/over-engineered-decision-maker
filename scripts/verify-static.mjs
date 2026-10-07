import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, sep } from 'node:path';

// dist is maintained source: verify it in place rather than deleting it as build output.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.match(html, /<base\s+href="\/"\s*>/, 'Nested SPA routes must resolve assets from /');
const imports = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
let checked = 0;
async function verify(reference, parent = resolve(root, 'index.html')) {
  if (/^(?:https?:|data:|#)/.test(reference)) return;
  const target = reference.startsWith('/') ? resolve(root, '.' + reference) : resolve(parent, '..', reference);
  assert.ok(relative(root, target) !== '..' && !relative(root, target).startsWith('..' + sep), `Asset outside dist: ${reference}`);
  assert.ok((await stat(target)).isFile(), `Missing asset: ${reference}`);
  checked++;
}
for (const match of html.matchAll(/(?:src|href)="([^"\s]+)"/g)) {
  if (match[1] !== '/') await verify(match[1]);
}
for (const reference of Object.values(imports)) await verify(reference);
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!entry.name.endsWith('.js')) continue;
    // Classic UMD bundles are checked through their HTML references; their
    // comments include example imports that are not runtime dependencies.
    if (entry.name.endsWith('.umd.js') || entry.name.endsWith('.min.js')) continue;
    const source = await readFile(path, 'utf8');
    for (const match of source.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]([^'"\s]+)['"]/g)) {
      const reference = match[1];
      if (reference.startsWith('.') || reference.startsWith('/')) await verify(reference, path);
      else if (!reference.includes(':')) {
        assert.ok(imports[reference], `Unmapped browser import: ${reference} in ${entry.name}`);
      }
    }
  }
}
await walk(root);
console.log(`Static build verified: dist/index.html and ${checked} asset/import references.`);
