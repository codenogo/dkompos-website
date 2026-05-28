#!/usr/bin/env node
// Bump the *current version* pointers across the site in one shot.
//
//   node scripts/release.mjs <new-version> [--size "37 MB"]
//
// It rewrites every occurrence of the current version string in the pages
// that only ever reference the current build (index, contact, privacy,
// README) and refreshes sitemap lastmod dates. It deliberately does NOT
// touch releases.html, because that file is the version *history*: a new
// release means adding a new entry by hand (with its own SHA-256 and notes),
// not search-and-replacing the previous version.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const newVersion = args.find((a) => !a.startsWith('--'));
const sizeIndex = args.indexOf('--size');
const newSize = sizeIndex !== -1 ? args[sizeIndex + 1] : null;

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Usage: node scripts/release.mjs <new-version> [--size "37 MB"]');
  console.error('  <new-version> must look like 1.5.7');
  process.exit(1);
}

const indexPath = join(root, 'index.html');
const indexHtml = await readFile(indexPath, 'utf8');

const urlMatch = indexHtml.match(/releases\/download\/v(\d+\.\d+\.\d+)\//);
if (!urlMatch) {
  console.error('Could not detect the current version from index.html download URL.');
  process.exit(1);
}
const currentVersion = urlMatch[1];

if (currentVersion === newVersion) {
  console.error(`index.html already points at v${newVersion}. Nothing to do.`);
  process.exit(1);
}

const currentSizeMatch = indexHtml.match(/"fileSize":\s*"([^"]+)"/);
const currentSize = currentSizeMatch ? currentSizeMatch[1] : null;

const today = new Date().toISOString().slice(0, 10);

const versionFiles = ['index.html', 'contact.html', 'privacy.html', 'README.md', 'package.json'];
const escaped = currentVersion.replace(/\./g, '\\.');
const versionRe = new RegExp(escaped, 'g');

const changed = [];

for (const rel of versionFiles) {
  const path = join(root, rel);
  const before = await readFile(path, 'utf8');
  let after = before.replace(versionRe, newVersion);

  if (rel === 'index.html' && newSize && currentSize && newSize !== currentSize) {
    after = after.split(currentSize).join(newSize);
  }

  if (after !== before) {
    await writeFile(path, after);
    changed.push(rel);
  }
}

// Refresh sitemap lastmod dates so crawlers see the update.
const sitemapPath = join(root, 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
const sitemapAfter = sitemap.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
if (sitemapAfter !== sitemap) {
  await writeFile(sitemapPath, sitemapAfter);
  changed.push('sitemap.xml');
}

const headersPath = join(root, '_headers');
const headers = await readFile(headersPath, 'utf8');
const cspHashes = await jsonLdHashes(['index.html', 'releases.html']);
const scriptSrc = `script-src 'self' ${cspHashes.map((hash) => `'sha256-${hash}'`).join(' ')};`;
const headersAfter = headers.replace(/script-src 'self'(?:\s+'sha256-[^']+')*;/, scriptSrc);
if (headersAfter !== headers) {
  await writeFile(headersPath, headersAfter);
  changed.push('_headers');
}

console.log(`Bumped v${currentVersion} -> v${newVersion}`);
if (newSize && newSize !== currentSize) {
  console.log(`Updated download size ${currentSize ?? '?'} -> ${newSize}`);
}
console.log('Files changed:');
for (const f of changed) console.log(`  - ${f}`);

console.log('\nStill to do by hand:');
console.log('  1. Add a new <article class="release-entry"> to releases.html with');
console.log('     the version, date, SHA-256, file name, size, and notes.');
console.log('  2. Add the matching SoftwareApplication object to the releases.html JSON-LD.');
console.log('  3. Upload the signed/notarised DMG to the GitHub release.');

async function jsonLdHashes(files) {
  const hashes = [];
  const scriptRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

  for (const rel of files) {
    const html = await readFile(join(root, rel), 'utf8');
    for (const match of html.matchAll(scriptRe)) {
      hashes.push(createHash('sha256').update(match[1]).digest('base64'));
    }
  }

  return hashes;
}
