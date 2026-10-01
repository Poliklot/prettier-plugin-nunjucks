import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import prettier from 'prettier';
import nunjucks from 'nunjucks';
import * as plugin from '../dist/plugin.js';

const format = (source, options = {}) => prettier.format(source, {
  parser: 'nunjucks', plugins: [plugin], ...options,
});

describe('source whitespace between adjacent inline expressions', () => {
  for (const separator of ['', ' ', '\n  ']) {
    for (const container of ['p', 'div', 'block', 'root']) {
      it(`preserves ${JSON.stringify(separator)} between adjacent variables in ${container}`, async () => {
        const text = `${paragraph} {{ one }}${separator}{{ two }} tail.`;
        const source = container === 'root' ? text : container === 'block'
          ? `{% block foo %}${text}{% endblock %}`
          : `<${container}>${text}</${container}>`;
        const output = await assertStable(source, { printWidth: 40 });
        const context = { dolor: 'dolor', one: 'one', two: 'two' };
        assert.equal(renderText(output, context), renderText(source, context));
        if (!separator) assert.ok(output.includes('{{ one }}{{ two }}'));
      });
    }
  }

  it('preserves glued expressions inside a short inline template block', async () => {
    const source = '{% block foo %}Hi {{ one }}{{ two }}!{% endblock %}';
    await assertStable(source, { printWidth: 120 }, `${source}\n`);
  });

  for (const endOfLine of ['lf', 'crlf', 'cr']) {
    it(`uses the correct source offsets with ${endOfLine} line endings`, async () => {
      const source = '<div>\nLorem ipsum {{ one }}\n{{ two }} sit, amet consectetur adipisicing elit.\n</div>';
      const eol = endOfLine === 'crlf' ? '\r\n' : endOfLine === 'cr' ? '\r' : '\n';
      const input = source.replaceAll('\n', eol);
      const output = await assertStable(input, { printWidth: 40, endOfLine });
      assert.equal(renderText(output, { one: 'one', two: 'two' }), renderText(input, { one: 'one', two: 'two' }));
    });
  }
});
const paragraph = 'Lorem ipsum {{ dolor }} sit, amet consectetur adipisicing elit.';
const blockParagraph = 'Lorem ipsum dolor sit amet {{ consectetur }} adipisicing elit. Eius odit blanditiis nobis temporibus voluptatem nihil aliquid cum velit saepe debitis sunt rerum totam quos et enim, quas, odio, ex consectetur!';
// Remove only these fixtures' literal wrapper tags, not arbitrary HTML.
const renderText = (source, values = { dolor: 'dolor', suffix: 'tail' }) =>
  nunjucks.renderString(source, values).replace(/<\/?(?:main|section|p|div|a|span)>/g, '').replace(/\s+/g, ' ').trim();

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

describe('inline template text from issue #37', () => {
  for (const variable of [true, false]) {
    it(`wraps the second example ${variable ? 'with' : 'without'} a variable regardless of source line breaks`, async () => {
      const text = variable ? blockParagraph : blockParagraph.replace('{{ consectetur }}', 'consectetur');
      const expectedText = variable
        ? '  Lorem ipsum dolor sit amet {{ consectetur }} adipisicing elit. Eius odit blanditiis nobis temporibus voluptatem nihil\n  aliquid cum velit saepe debitis sunt rerum totam quos et enim, quas, odio, ex consectetur!'
        : '  Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius odit blanditiis nobis temporibus voluptatem nihil\n  aliquid cum velit saepe debitis sunt rerum totam quos et enim, quas, odio, ex consectetur!';
      const expected = `{% block foo %}\n${expectedText}\n{% endblock %}\n`;
      for (const body of [text, `\n  ${text}\n`, `\n  ${text.replace('Lorem ', 'Lorem\n  ')}\n`]) {
        const source = `{% block foo %}${body}{% endblock %}`;
        const output = await assertStable(source, { printWidth: 120 }, expected);
        assert.equal(renderText(output, { consectetur: 'consectetur' }), renderText(source, { consectetur: 'consectetur' }));
      }
    });
  }

  it('formats an HTML paragraph inside a template block consistently', async () => {
    await assertStable(`{% block foo %}<p>${paragraph}</p>{% endblock %}`, { printWidth: 40 }, `{% block foo %}
  <p>
    Lorem ipsum {{ dolor }} sit, amet
    consectetur adipisicing elit.
  </p>
{% endblock %}\n`);
  });

  it('wraps configured custom inline tags inside template blocks', async () => {
    const text = blockParagraph.replace('{{ consectetur }}', '{% inlinevalue %}');
    const options = { printWidth: 120, inlineTags: ['inlinevalue'] };
    const output = await assertStable(`{% block foo %}${text}{% endblock %}`, options);
    assert.ok(output.includes('Lorem ipsum dolor sit amet {% inlinevalue %} adipisicing elit.'));
    assert.ok(output.trimEnd().split('\n').every((line) => line.length <= options.printWidth));
    assert.equal(await format(`{% block foo %}${text.replace('Lorem ', 'Lorem\n')}{% endblock %}`, options), output);
  });

  it('wraps text on the template root without separating glued variables', async () => {
    const source = `prefix{{ suffix }} ${blockParagraph} tail{{ suffix }}!`;
    const options = { printWidth: 60 };
    const output = await assertStable(source, options);
    assert.ok(output.includes('prefix{{ suffix }}'));
    assert.ok(output.includes('tail{{ suffix }}!'));
    assert.ok(output.trimEnd().split('\n').every((line) => line.length <= options.printWidth));
    assert.equal(renderText(output), renderText(source));
    assert.equal(await format(source.replace('Lorem ', 'Lorem\n'), options), output);
  });

  it('does not carry standalone variable indentation into a root text flow', async () => {
    const source = 'Hello\n  {{ name }}\n  friend welcome to the amazing world of templating.';
    const options = { printWidth: 40 };
    const expected = await format(source.replace(/\s+/g, ' '), options);
    await assertStable(source, options, expected);
    await assertStable(`\n\n${source}\n\n`, options, expected);
  });

  for (const printWidth of [40, 60, 120]) {
    for (const indentation of [{ tabWidth: 2 }, { tabWidth: 4 }, { tabWidth: 4, useTabs: true }]) {
      it(`keeps nested template branches as text flows at width ${printWidth} with ${JSON.stringify(indentation)}`, async () => {
        const text = `prefix{{ suffix }} ${paragraph} ${paragraph} tail{{ suffix }}!`;
        const source = `{% block foo %}\n{% if enabled %}${text}{% elif alternative %}${text}{% else %}${text}{% endif %}\n{% endblock %}`;
        const options = { printWidth, ...indentation };
        const output = await assertStable(source, options);
        assert.ok(output.includes('prefix{{ suffix }}'));
        assert.ok(output.includes('tail{{ suffix }}!'));
        assert.ok(output.trimEnd().split('\n').every((line) =>
          line.replace(/^\t+/, (tabs) => ' '.repeat(tabs.length * indentation.tabWidth)).length <= printWidth));
        for (const values of [{ enabled: true }, { enabled: false, alternative: true }, { enabled: false, alternative: false }]) {
          const context = { dolor: 'dolor', suffix: 'tail', ...values };
          assert.equal(renderText(output, context), renderText(source, context));
        }
      });
    }
  }

  it('preserves raw and whitespace-sensitive content within template blocks', async () => {
    for (const content of [
      `{% raw %}${blockParagraph}\n   untouched{% endraw %}`,
      `<pre>  ${blockParagraph}\n   untouched</pre>`,
      `<textarea>  ${blockParagraph}\n   untouched</textarea>`,
    ]) {
      const output = await assertStable(`{% block foo %}\n${content}\n{% endblock %}`, { printWidth: 40 });
      assert.ok(output.includes(content));
    }
  });
});
