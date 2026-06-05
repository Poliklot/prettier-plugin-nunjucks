import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import * as plugin from '../dist/plugin.js';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Usage: node scripts/format-nunjucks-files.mjs <file> [more-files...]');
  process.exit(1);
}

for (const filePath of files) {
  const source = await fs.readFile(filePath, 'utf8');
  const formatted = await prettier.format(source, {
    parser: 'nunjucks',
    plugins: [plugin],
    printWidth: 80,
    tabWidth: 2,
  });

  await fs.writeFile(filePath, formatted, 'utf8');
  console.log(`formatted\t${path.resolve(filePath)}`);
}
