import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nunjucksDialect } from '../dist/dialects/nunjucks/tokens.js';

describe('nunjucks dialect tokens', () => {
  it('classifies variables, comments, statement tags, blocks, and branches', () => {
    assert.deepEqual({ ...nunjucksDialect.parseToken('{{ value }}', 0), start: 0, end: 0 }, {
      kind: 'mustache',
      content: 'value',
      rawContent: ' value ',
      rawInner: 'value',
      start: 0,
      end: 0,
      triple: false,
      trimOpen: false,
      trimClose: false,
      name: undefined,
    });
    assert.equal(nunjucksDialect.parseToken('{# comment #}', 0).kind, 'comment');
    assert.equal(nunjucksDialect.parseToken('{# comment #}', 0).content, 'comment');
    assert.equal(nunjucksDialect.parseToken('{% include "card.njk" %}', 0).kind, 'mustache');
    assert.equal(nunjucksDialect.parseToken('{% include "card.njk" %}', 0).triple, true);
    assert.equal(nunjucksDialect.parseToken('{% if user.active %}', 0).kind, 'blockStart');
    assert.equal(nunjucksDialect.parseToken('{% if user.active %}', 0).name, 'if');
    assert.equal(nunjucksDialect.parseToken('{% endif %}', 0).kind, 'blockEnd');
    assert.equal(nunjucksDialect.parseToken('{% endif %}', 0).name, 'if');
    assert.equal(nunjucksDialect.parseToken('{% elif archived %}', 0).specialForm, 'elseIf');
    assert.equal(nunjucksDialect.parseToken('{% elif archived %}', 0).branchKeyword, 'elif');
    assert.equal(nunjucksDialect.parseToken('{% elseif archived %}', 0).branchKeyword, 'elseif');
  });

  it('maps async block close aliases', () => {
    assert.equal(nunjucksDialect.parseToken('{% asyncEach item in items %}', 0).name, 'asyncEach');
    assert.equal(nunjucksDialect.parseToken('{% endeach %}', 0).name, 'asyncEach');
    assert.equal(nunjucksDialect.parseToken('{% asyncAll item in items %}', 0).name, 'asyncAll');
    assert.equal(nunjucksDialect.parseToken('{% endall %}', 0).name, 'asyncAll');
  });

  it('finds only real openings and skips escaped openings', () => {
    const source = 'body { color: red } \\{{ literal }} {% if ok %}';
    assert.equal(nunjucksDialect.findNextOpen(source, 0), source.indexOf('{%'));
  });

  it('preserves raw and verbatim block ranges', () => {
    const raw = '{% raw %}{{ ignored }}{% endraw %}<p>{{ value }}</p>';
    assert.equal(nunjucksDialect.consumeRawBlock(raw, 0), '{% raw %}{{ ignored }}{% endraw %}'.length);

    const verbatim = '{% verbatim %}{{ ignored }}{% endverbatim %}';
    assert.equal(nunjucksDialect.consumeRawBlock(verbatim, 0), verbatim.length);
  });
});
