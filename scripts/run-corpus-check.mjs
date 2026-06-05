import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import * as plugin from '../dist/plugin.js';

const [, , ...roots] = process.argv;

if (roots.length === 0) {
  console.error('Usage: node scripts/run-corpus-check.mjs <root> [more-roots...]');
  process.exit(1);
}

const exts = new Set(['.njk', '.nunjucks']);

async function listTemplateFiles(root) {
  const files = [];

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        await walk(fullPath);
        continue;
      }
      if (exts.has(path.extname(entry.name))) files.push(fullPath);
    }
  }

  await walk(root);
  return files.sort();
}

async function analyzeFile(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  try {
    const formatted = await prettier.format(source, { parser: 'nunjucks', plugins: [plugin], printWidth: 80 });
    const secondPass = await prettier.format(formatted, { parser: 'nunjucks', plugins: [plugin], printWidth: 80 });
    return { filePath, ok: true, changed: formatted !== source, idempotent: secondPass === formatted };
  } catch (error) {
    return { filePath, ok: false, error: error instanceof Error ? error.stack ?? error.message : String(error) };
  }
}

const repos = [];
for (const root of roots) {
  const files = await listTemplateFiles(root);
  const results = [];
  for (const filePath of files) results.push(await analyzeFile(filePath));
  const failed = results.filter((item) => !item.ok);
  const nonIdempotent = results.filter((item) => item.ok && !item.idempotent);
  const changed = results.filter((item) => item.ok && item.changed);
  repos.push({ root, total: results.length, failedCount: failed.length, changedCount: changed.length, unchangedCount: results.length - failed.length - changed.length, nonIdempotentCount: nonIdempotent.length, failed, nonIdempotent });
}

const report = { startedAt: new Date().toISOString(), repos, finishedAt: new Date().toISOString() };
console.log(JSON.stringify(report, null, 2));

if (repos.some((repo) => repo.failedCount > 0 || repo.nonIdempotentCount > 0)) process.exit(1);
