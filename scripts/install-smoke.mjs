import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const prettierBin = process.platform === 'win32' ? path.join('node_modules', '.bin', 'prettier.cmd') : path.join('node_modules', '.bin', 'prettier');
const prettierVersion = process.env.PRETTIER_VERSION || 'latest';
const keepTemp = process.env.KEEP_INSTALL_SMOKE === '1';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdio: 'inherit' });
  if (typeof result.status === 'number' && result.status !== 0) process.exit(result.status);
  if (result.error) throw result.error;
}

const smokeRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'prettier-plugin-nunjucks-install-'));
const npmCache = path.join(smokeRoot, 'npm-cache');
const projectRoot = path.join(smokeRoot, 'project');

try {
  await fs.mkdir(npmCache, { recursive: true });
  await fs.mkdir(projectRoot, { recursive: true });
  run(npmCommand, ['pack', '--pack-destination', smokeRoot], { cwd: repoRoot, env: { npm_config_cache: npmCache } });
  const tarball = (await fs.readdir(smokeRoot)).find((entry) => entry.endsWith('.tgz'));
  if (!tarball) throw new Error('npm pack did not produce a tarball');

  await fs.writeFile(path.join(projectRoot, 'package.json'), `${JSON.stringify({ private: true, type: 'commonjs' }, null, 2)}\n`);
  await fs.writeFile(path.join(projectRoot, '.prettierrc.cjs'), ['module.exports = {', '  plugins: ["prettier-plugin-nunjucks"],', '};', ''].join('\n'));
  await fs.writeFile(path.join(projectRoot, 'sample.njk'), '{% if page_obj.number > 2 %}\n<li class="page-item"><a href="{{ url }}">{{page_obj.number}}</a></li>\n{% endif %}\n\n{% if page_obj.number > 1 %}<li>{{page_obj.number}}</li>{% endif %}');

  run(npmCommand, ['install', '--save-dev', `prettier@${prettierVersion}`, path.join(smokeRoot, tarball)], { cwd: projectRoot, env: { npm_config_cache: npmCache } });
  run(path.join(projectRoot, prettierBin), ['--write', 'sample.njk'], { cwd: projectRoot });

  const formatted = await fs.readFile(path.join(projectRoot, 'sample.njk'), 'utf8');
  if (formatted.includes('{% endif %} {% if page_obj.number > 1 %}')) {
    console.error('Adjacent blocks were collapsed.');
    process.exit(1);
  }
  if (!formatted.includes('{{ page_obj.number }}')) {
    console.error('Variable spacing was not normalized.');
    process.exit(1);
  }
  console.log(`Install smoke passed with prettier@${prettierVersion}.`);
} finally {
  if (keepTemp) console.log(`Keeping install smoke directory: ${smokeRoot}`);
  else await fs.rm(smokeRoot, { recursive: true, force: true });
}
