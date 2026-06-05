import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../dist/parser.js';

describe('nunjucks parser', () => {
  it('parses variables, statement tags, and comments in HTML attributes and children', () => {
    const ast = parse('<a href="{{ url }}" class="btn {% if active %}active{% endif %}">{# c #}{{ label }}</a>');
    const element = ast.body[0];

    assert.equal(element.type, 'ElementNode');
    assert.equal(element.tag, 'a');
    assert.equal(element.attributes[0].name, 'href');
    assert.equal(element.attributes[0].value.parts[0].type, 'MustacheStatement');
    assert.equal(element.attributes[0].value.parts[0].path, 'url');
    assert.equal(element.attributes[0].value.parts[0].triple, false);
    assert.equal(element.attributes[1].name, 'class');
    assert.equal(element.children[0].type, 'CommentStatement');
    assert.equal(element.children[1].type, 'MustacheStatement');
    assert.equal(element.children[1].path, 'label');
  });

  it('parses if, elif, else, and endif as one block', () => {
    const ast = parse('{% if ok %}<p>ok</p>{% elif maybe %}<p>maybe</p>{% else %}<p>no</p>{% endif %}');
    const block = ast.body[0];

    assert.equal(block.type, 'BlockStatement');
    assert.equal(block.path, 'if');
    assert.deepEqual(block.params, ['ok']);
    assert.equal(block.inverseChain[0].type, 'ElseBranch');
    assert.equal(block.inverseChain[0].branchKeyword, 'elif');
    assert.equal(block.inverseChain[0].path, 'maybe');
    assert.equal(block.inverse.body[0].type, 'ElementNode');
    assert.equal(block.inverse.body[0].tag, 'p');
  });
});
