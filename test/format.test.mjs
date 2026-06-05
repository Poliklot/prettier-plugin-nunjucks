import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import prettier from 'prettier';
import * as plugin from '../dist/plugin.js';

async function format(source, options = {}) {
  return prettier.format(source, {
    parser: 'nunjucks',
    plugins: [plugin],
    printWidth: 80,
    tabWidth: 2,
    ...options,
  });
}

describe('prettier-plugin-nunjucks formatting', () => {
  it('keeps adjacent standalone blocks separated', async () => {
    const source = `{% if page_obj.number > 2 %}
<li class="page-item">
  <a class="page-link" href="?page=1">1</a>
</li>
{% endif %}

{% if page_obj.number > 1 %}
<li class="page-item">
  <a class="page-link" href="?page={{ page_obj.previous_page_number }}">{{ page_obj.previous_page_number }}</a>
</li>
{% endif %}`;

    const output = await format(source);
    assert.equal(output.includes('{% endif %} {% if page_obj.number > 1 %}'), false);
    assert.equal(output.includes('{% endif %}\n\n{% if page_obj.number > 1 %}'), true);
  });

  it('formats variables, comments, and simple statement tags', async () => {
    const output = await format('<p>{{user.name}}</p>{#hello#}{% include "card.njk" %}');
    assert.equal(output.includes('<p>{{ user.name }}</p>'), true);
    assert.equal(output.includes('{# hello #}'), true);
    assert.equal(output.includes('{% include "card.njk" %}'), true);
  });

  it('formats nested if and for blocks', async () => {
    const source = `{% if users %}<ul>{% for user in users %}<li>{{user.name}}</li>{% endfor %}</ul>{% else %}<p>No users.</p>{% endif %}`;
    const output = await format(source);

    assert.equal(output.includes('{% if users %}'), true);
    assert.equal(output.includes('{% for user in users %}'), true);
    assert.equal(output.includes('<li>'), true);
    assert.equal(output.includes('{{ user.name }}'), true);
    assert.equal(output.includes('</li>'), true);
    assert.equal(output.includes('{% else %}'), true);
    assert.equal(output.includes('{% endif %}'), true);
    assert.equal(await format(output), output);
  });

  it('preserves elif and elseif branch keywords', async () => {
    const elifOutput = await format('{% if users %}<p>Users</p>{% elif archived %}<p>Archived</p>{% else %}<p>None</p>{% endif %}');
    assert.equal(elifOutput.includes('{% elif archived %}'), true);

    const elseifOutput = await format('{% if users %}<p>Users</p>{% elseif archived %}<p>Archived</p>{% endif %}');
    assert.equal(elseifOutput.includes('{% elseif archived %}'), true);
  });

  it('formats statement tags inside attributes', async () => {
    const source = '<a class="btn {% if active %}btn--active{% endif %}" href="{{ url }}">{{user.name}}</a>';
    const output = await format(source);

    assert.equal(output.includes('{% if active %}'), true);
    assert.equal(output.includes('btn--active'), true);
    assert.equal(output.includes('{% endif %}'), true);
    assert.equal(output.includes('{{ user.name }}'), true);
  });

  it('formats asyncEach and asyncAll blocks', async () => {
    const each = await format('{% asyncEach item in items %}<span>{{item.id}}</span>{% endeach %}');
    assert.equal(each.includes('{% asyncEach item in items %}'), true);
    assert.equal(each.includes('{% endeach %}'), true);

    const all = await format('{% asyncAll item in items %}<span>{{item.id}}</span>{% endall %}');
    assert.equal(all.includes('{% asyncAll item in items %}'), true);
    assert.equal(all.includes('{% endall %}'), true);
  });

  it('preserves raw and verbatim blocks', async () => {
    const output = await format('{% raw %}<div>{{ untouched }}</div>{% endraw %}\n{% verbatim %}{{ also_untouched }}{% endverbatim %}');
    assert.equal(output.includes('{% raw %}<div>{{ untouched }}</div>{% endraw %}'), true);
    assert.equal(output.includes('{% verbatim %}{{ also_untouched }}{% endverbatim %}'), true);
  });

  it('formats block, macro, set, filter, and call block forms', async () => {
    const source = `{% block content %}<main>{{body}}</main>{% endblock %}
{% macro field(name, value='') %}<input name="{{name}}" value="{{value}}">{% endmacro %}
{% set modal %}<div>{{content}}</div>{% endset %}
{% filter title %}hello world{% endfilter %}
{% call render_panel('x') %}<p>{{body}}</p>{% endcall %}`;
    const output = await format(source);

    assert.equal(output.includes('{% block content %}'), true);
    assert.equal(output.includes('{% endblock %}'), true);
    assert.equal(output.includes("{% macro field(name, value='') %}"), true);
    assert.equal(output.includes('{% endmacro %}'), true);
    assert.equal(output.includes('{% set modal %}'), true);
    assert.equal(output.includes('{% endset %}'), true);
    assert.equal(output.includes('{% filter title %}'), true);
    assert.equal(output.includes('{% endfilter %}'), true);
    assert.equal(output.includes("{% call render_panel('x') %}"), true);
    assert.equal(output.includes('{% endcall %}'), true);
  });


  it('keeps whitespace-control class blocks expanded and idempotent', async () => {
    const source = '<fieldset class="govuk-fieldset {%- if params.classes %} {{ params.classes }}{% endif %}"></fieldset>';
    const output = await format(source, { printWidth: 100 });

    assert.equal(output.includes('{%- if params.classes %}'), true);
    assert.equal(output.includes('{{ params.classes }}'), true);
    assert.equal(output.includes('{% endif %}'), true);
    assert.equal(output.includes('{%- if params.classes %}{{ params.classes }}{% endif %}'), false);
    assert.equal(await format(output, { printWidth: 100 }), output);
  });


  it('keeps Nunjucks assignment and filter expressions readable', async () => {
    const source = '{% set items = [1, 2, 3] %}{{ items | join(", ") }}';
    const output = await format(source);

    assert.equal(output.includes('{% set items = [1, 2, 3] %}'), true);
    assert.equal(output.includes('{{ items | join(", ") }}'), true);
    assert.equal(await format(output), output);
  });

  it('keeps single statement tags as statement tags', async () => {
    const output = await format('{% extends "base.njk" %}{% set username = "joe" %}<p>{{ username }}</p>');
    assert.equal(output.includes('{% extends "base.njk" %}'), true);
    assert.equal(output.includes('{% set username = "joe" %}'), true);
  });
});
