import assert from 'node:assert/strict';
import { test } from 'node:test';
import engine from 'nunjucks';
import prettier from 'prettier';
import * as plugin from '../dist/plugin.js';

// HTML proof collapses only browser-collapsible ASCII whitespace, not NBSP or
// other Unicode data. Plain templates and lambda bodies are compared exactly.
const htmlText = (s) => s.replace(/<\/?(?:p|span|div|b)>/g, '').replace(/[\t\n\f\r ]+/g, ' ').replace(/^ | $/g, '');
const optionsMatrix = [
  { printWidth: 80 }, { printWidth: 20 },
  { printWidth: 120, htmlWhitespaceSensitivity: 'strict' },
  { printWidth: 80, useTabs: true, tabWidth: 4, embeddedLanguageFormatting: 'off' },
];
const view = {
  a: 'A', b: 'B', x: 3, n: 10, ok: true, html: '<b>ok</b>',
  'first  name': 'DOUBLE', 'first name': 'SINGLE', 'foo ( bar )': 'ORIGINAL',
  'foo (bar)': 'CHANGED', 'x as |y|': 'KEY',
};
const environment = new engine.Environment(null, { autoescape: false });
const render = (s, data = view) => environment.renderString(s, { ...data, echo: value => value });
async function prove(source, html = false, data = view) {
  const before = render(source, data);
  for (const options of optionsMatrix) {
    const once = await prettier.format(source, { parser: 'nunjucks', plugins: [plugin], ...options });
    const after = render(once, data);
    assert.equal(html ? htmlText(after) : after, html ? htmlText(before) : before, JSON.stringify({ source, options, once }));
    assert.equal(await prettier.format(once, { parser: 'nunjucks', plugins: [plugin], ...options }), once);
  }
}
const nodes = ['{{a}}', '<b>{{b}}</b>', '{# note #}', '{% if ok %}K{% endif %}'];
for (const wrapper of ['', 'p', 'span', 'div']) {
  test(`source boundaries preserve execution in ${wrapper || 'plain text'}`, async () => {
    for (const left of nodes) for (const right of nodes) for (const gap of ['', ' ', '\n', '\u00a0', '\u202f']) {
      const text = `${left}${gap}${right}`;
      await prove(wrapper ? `<${wrapper}>${text}</${wrapper}>\n` : `${text}\n`, Boolean(wrapper));
    }
  });
}
for (const source of [
  '<p>X<span> Y </span>Z</p>\n', '<p>X<span> </span>Z</p>\n',
  '<p>A\u00a0B</p>\n', '<p>{{a}}\u202f{{b}}</p>\n',
  '<p>X<span>\u00a0</span>Z</p>\n', '<span>\u00a0{{a}}\u00a0</span>\n',
]) test(`HTML data and inline edges: ${JSON.stringify(source)}`, () => prove(source, true));
for (const source of ['A\u00a0\n', 'A\u202f\n', 'Before\n  {{a}}\nAfter\n']) {
  test(`literal template data: ${JSON.stringify(source)}`, () => prove(source, source.startsWith('<')));
}
for (const source of [
  '{{ -x }}\n', '{{ -1 }}\n', '{{ -(n + x) }}\n', '{{ -n - x }}\n',
  'A {{- -x -}} B\n', '<p>Total: {{ -n }}</p>\n',
  'A {#- note -#} B\n', 'A {#- note #} B\n', 'A {# note -#} B\n',
  '{{ "a ( b )" }}\n', "{{ 'a ( b )' }}\n", '{{ echo("a ( b )") }}\n',
  '{{ "a as |x| b" }}\n', '{{ "a" + " ( b )" }}\n', '{% set value = "a ( b )" %}{{ value }}\n',
]) test(`dialect semantics: ${JSON.stringify(source)}`, () => prove(source, source.startsWith('<')));

test('whitespace-only inverse branches still produce output', async () => {
  await prove('A{% if ok %}B{% else %} {% endif %}C\n', false, { ...view, ok: false });
});

test('conditional class fragments retain token boundaries in both branches', async () => {
  for (const value of ['a{% if ok %}b{% else %} {% endif %}c', 'a{% if ok %} {% else %}b{% endif %}c', 'button{% if ok %}-active{% endif %}']) {
    const source = `<p class="${value}">x</p>\n`;
    for (const ok of [true, false]) for (const options of optionsMatrix) {
      const output = await prettier.format(source, { parser: 'nunjucks', plugins: [plugin], ...options });
      const before = render(source, { ...view, ok }).match(/class="([^"]*)"/)[1];
      const after = render(output, { ...view, ok }).match(/class="([^"]*)"/)[1];
      assert.equal(before.replace(/[\t\n\f\r ]+/g, ' ').trim(), after.replace(/[\t\n\f\r ]+/g, ' ').trim());
      assert.equal(await prettier.format(output, { parser: 'nunjucks', plugins: [plugin], ...options }), output);
    }
  }
});
