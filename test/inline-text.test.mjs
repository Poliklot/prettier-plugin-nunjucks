import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import prettier from 'prettier';
import nunjucks from 'nunjucks';
import * as plugin from '../dist/plugin.js';

const format = (source, options = {}) => prettier.format(source, {
  parser: 'nunjucks', plugins: [plugin], ...options,
});
const paragraph = 'Lorem ipsum {{ dolor }} sit, amet consectetur adipisicing elit.';
const renderText = (source, values = { dolor: 'dolor', suffix: 'tail' }) =>
  nunjucks.renderString(source, values).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function assertStable(source, options, expected) {
  const output = await format(source, options);
  if (expected !== undefined) assert.equal(output, expected);
  assert.equal(await format(output, options), output);
  assert.equal(await format(await format(output, options), options), output);
  return output;
}

describe('inline HTML text from issue #37', () => {
  it('formats the complete first example consistently at printWidth 40', async () => {
    const source = `<p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>\n\n<p>${paragraph}</p>\n\n<div>${paragraph}</div>`;
    await assertStable(source, { printWidth: 40 }, `<p>
  Lorem ipsum dolor sit, amet
  consectetur adipisicing elit.
</p>

<p>
  Lorem ipsum {{ dolor }} sit, amet
  consectetur adipisicing elit.
</p>

<div>
  Lorem ipsum {{ dolor }} sit, amet
  consectetur adipisicing elit.
</div>\n`);
  });

  for (const tag of ['p', 'div', 'section']) {
    for (const printWidth of [40, 60, 120]) {
      for (const indentation of [{ tabWidth: 2 }, { tabWidth: 4 }, { tabWidth: 4, useTabs: true }]) {
        it(`keeps the text flow inside ${tag} at width ${printWidth} with ${JSON.stringify(indentation)}`, async () => {
          const text = `prefix{{ suffix }} ${paragraph} ${paragraph} tail{{ suffix }}!`;
          const source = `<main><${tag}>${text}</${tag}></main>`;
          const options = { printWidth, ...indentation };
          const output = await assertStable(source, options);
          assert.equal(renderText(output), renderText(source));
          assert.ok(output.includes('prefix{{ suffix }}'));
          assert.ok(output.includes('tail{{ suffix }}!'));
          assert.ok(output.trimEnd().split('\n').every((line) =>
            line.replace(/^\t+/, (tabs) => ' '.repeat(tabs.length * indentation.tabWidth)).length <= printWidth));
        });
      }
    }
  }

  it('keeps short text and variables inline in both paragraph and container tags', async () => {
    for (const tag of ['p', 'div']) {
      await assertStable(`<${tag}>Hello {{name}}!</${tag}>`, {}, `<${tag}>Hello {{ name }}!</${tag}>\n`);
    }
  });

  it('preserves significant tag boundaries in actual inline elements', async () => {
    for (const tag of ['a', 'span']) {
      const source = `<${tag}>prefix{{suffix}} ${paragraph}</${tag}>`;
      const output = await assertStable(source, { printWidth: 40 });
      assert.ok(output.includes(`<${tag}>prefix{{ suffix }}`));
      assert.ok(output.includes(`elit.</${tag}>`));
      assert.equal(renderText(output), renderText(source));
    }
  });

  it('keeps whitespace-control variables and glued punctuation intact', async () => {
    for (const tag of ['p', 'div']) {
      const source = `<${tag}>prefix {{- suffix -}} ! ${paragraph}</${tag}>`;
      const output = await assertStable(source, { printWidth: 40 });
      assert.equal(renderText(output), renderText(source));
      assert.ok(output.includes('{{- suffix -}}'));
    }
  });

  it('wraps configured custom inline statement tags as part of the text flow', async () => {
    for (const tag of ['p', 'div']) {
      const source = `<${tag}>${paragraph.replace('{{ dolor }}', '{% inlinevalue %}')}</${tag}>`;
      const output = await assertStable(source, { printWidth: 40, inlineTags: ['inlinevalue'] });
      assert.equal(output, `<${tag}>\n  Lorem ipsum {% inlinevalue %} sit,\n  amet consectetur adipisicing elit.\n</${tag}>\n`);
    }
  });
});
