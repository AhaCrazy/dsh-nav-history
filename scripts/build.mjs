// Builds the single browser artifact `client.js` from the ES modules in `src/`.
//
// The DSH client module loader only evaluates one plain script per plugin, so
// shipping ESM directly is not an option. This tiny dependency-free bundler
// concatenates the modules in dependency order inside the loader factory:
// import lines are dropped, `export ` keywords are removed and one line is
// appended that installs the module object on `window.__ModuleLoader__`.
//
// Usage:
//   node scripts/build.mjs           # write client.js
//   node scripts/build.mjs --check   # fail if client.js is out of date
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_ID = 'dsh-nav-history';

const MODULES = [
  'src/constants.js',
  'src/locales.js',
  'src/styles.js',
  'src/utils.js',
  'src/storage.js',
  'src/history.js',
  'src/shortcuts.js',
  'src/view.js',
  'src/apply.js',
];

const BANNER = [
  '/* Generated file - do not edit. Edit src/*.js and run `npm run build`. */',
  "window.__ModuleLoader__.load({",
  `  id: '${PACKAGE_ID}',`,
  '  factory(require) {',
  "    const React = require('react');",
].join('\n');

function stripModule(source) {
  // Drop import statements, including the multi-line `import { ... } from '...'`
  // form used for readability in src/apply.js.
  const withoutImports = source.replace(/^import\b[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '');
  // Drop named export lists (`export { a, b };`), single- or multi-line.
  const withoutExports = withoutImports.replace(/^export\s*\{[\s\S]*?\}\s*;?\s*$/gm, '');
  return withoutExports
    .split('\n')
    .map((line) => line.replace(/^export\s+(const|function|class|async)\s/, '$1 '))
    .join('\n');
}

function indent(text) {
  return text
    .split('\n')
    .map((line) => (line === '' ? '' : `  ${line}`))
    .join('\n');
}

function build() {
  const body = MODULES.map((file) => stripModule(readFileSync(join(root, file), 'utf8')).trim())
    .filter(Boolean)
    .join('\n\n');
  return `${BANNER}\n${indent(body)}\n    return createClientModule(React);\n  },\n});\n`;
}

const output = build();
const target = join(root, 'client.js');

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch (error) {
    console.error('[build] client.js is missing. Run: node scripts/build.mjs');
    process.exit(1);
  }
  if (current !== output) {
    console.error('[build] client.js is out of date. Run: node scripts/build.mjs');
    process.exit(1);
  }
  console.log('[build] client.js is up to date');
} else {
  writeFileSync(target, output);
  console.log(`[build] wrote client.js (${output.length} bytes)`);
}
