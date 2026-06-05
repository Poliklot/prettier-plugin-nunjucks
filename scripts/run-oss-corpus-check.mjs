import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const corpusRoot = path.resolve(process.env.OSS_CORPUS_ROOT ?? path.join(os.tmpdir(), 'nunjucks-oss-corpus'));
const skipClone = process.env.OSS_CORPUS_SKIP_CLONE === '1' || process.argv.includes('--no-clone');

const repos = [
  { slug: '11ty/eleventy-base-blog', dir: 'eleventy-base-blog' },
  { slug: 'mozilla/nunjucks', dir: 'nunjucks' },
  { slug: 'alphagov/govuk-frontend', dir: 'govuk-frontend' },
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
}

fs.mkdirSync(corpusRoot, { recursive: true });
for (const repo of repos) {
  const target = path.join(corpusRoot, repo.dir);
  if (fs.existsSync(target)) {
    console.log(`Using existing ${repo.slug} at ${target}`);
    continue;
  }
  if (skipClone) throw new Error(`Missing ${target}. Re-run without --no-clone or set OSS_CORPUS_ROOT.`);
  console.log(`Cloning ${repo.slug}...`);
  const result = run('git', ['clone', '--depth', '1', `https://github.com/${repo.slug}.git`, target], { cwd: corpusRoot, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Failed to clone ${repo.slug}`);
}

const roots = repos.map((repo) => path.join(corpusRoot, repo.dir));
const result = run(process.execPath, [path.join(scriptDir, 'run-corpus-check.mjs'), ...roots], { cwd: repoRoot });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
