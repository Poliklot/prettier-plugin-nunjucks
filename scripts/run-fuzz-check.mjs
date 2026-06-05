import prettier from 'prettier';
import * as plugin from '../dist/plugin.js';

const caseCount = Number.parseInt(process.env.NUNJUCKS_FUZZ_CASES ?? '400', 10);
let seed = Number.parseInt(process.env.NUNJUCKS_FUZZ_SEED ?? '20260605', 10) >>> 0;

function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function pick(items) {
  return items[Math.floor(random() * items.length)];
}

const atoms = [
  '{{ value }}',
  '{{ user.name|default("Anonymous") }}',
  '{{- compact -}}',
  '{# comment #}',
  '{% extends "base.njk" %}',
  '{% include "card.njk" %}',
  '{% import "forms.njk" as forms %}',
  '{% set username = "joe" %}',
  '{% if active %}active{% endif %}',
  '{% if ok -%} yes {%- else %} no {%- endif %}',
  '{% if users %}<p>Users</p>{% elif archived %}<p>Archived</p>{% else %}<p>None</p>{% endif %}',
  '{% if users %}<p>Users</p>{% elseif archived %}<p>Archived</p>{% endif %}',
  '{% for item in items %}<span>{{ item.name }}</span>{% else %}<em>Empty</em>{% endfor %}',
  '{% asyncEach item in items %}<span>{{ item.name }}</span>{% endeach %}',
  '{% asyncAll item in items %}<span>{{ item.name }}</span>{% endall %}',
  '{% block content %}<main>{{ content }}</main>{% endblock %}',
  '{% macro field(name, value=\'\') %}<input name="{{ name }}" value="{{ value }}">{% endmacro %}',
  '{% set modal %}<div>{{ content }}</div>{% endset %}',
  '{% filter title %}hello world{% endfilter %}',
  '{% call render_panel("x") %}<p>{{ body }}</p>{% endcall %}',
  '<a href="{{ url }}">{{ label }}</a>',
  '<div class="box {% if active %}box--active{% endif %} {{ extra }}"></div>',
  '<script>const state={count:1};function read(){return state.count}</script>',
  '<style>.banner{color:red;background:#fff}</style>',
  '{% raw %}<div>{{ ignored }}</div>{% endraw %}',
  '{% verbatim %}{{ ignored }}{% endverbatim %}',
];

const wrappers = [
  (body) => body,
  (body) => `<section>${body}</section>`,
  (body) => `<div class="wrap">\n${body}\n</div>`,
  (body) => `{% if visible %}\n${body}\n{% endif %}`,
  (body) => `{# header #}\n${body}\n{# footer #}`,
];

function buildGeneratedCase(index) {
  const pieceCount = 1 + Math.floor(random() * 5);
  const separator = pick(['', ' ', '\n', '\n\n']);
  const pieces = [];
  for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex += 1) pieces.push(pick(atoms));
  return { id: `generated-${index}`, source: pick(wrappers)(pieces.join(separator)) };
}

const fixedCases = atoms.map((source, index) => ({ id: `fixed-${index}`, source }));
const generatedCases = Array.from({ length: Number.isFinite(caseCount) ? Math.max(caseCount, 0) : 400 }, (_, index) => buildGeneratedCase(index));
const cases = [...fixedCases, ...generatedCases];
const failures = [];

for (const testCase of cases) {
  try {
    const firstPass = await prettier.format(testCase.source, { parser: 'nunjucks', plugins: [plugin], printWidth: 80 });
    const secondPass = await prettier.format(firstPass, { parser: 'nunjucks', plugins: [plugin], printWidth: 80 });
    if (secondPass !== firstPass) failures.push({ id: testCase.id, type: 'non-idempotent', source: testCase.source, firstPass, secondPass });
  } catch (error) {
    failures.push({ id: testCase.id, type: 'crash', source: testCase.source, error: error instanceof Error ? error.stack ?? error.message : String(error) });
  }
}

if (failures.length > 0) {
  console.error(`Fuzz check failed: ${failures.length}/${cases.length} cases failed.`);
  for (const failure of failures.slice(0, 10)) {
    console.error(`\n--- ${failure.id} ${failure.type} ---`);
    console.error(failure.source);
    if (failure.type === 'crash') console.error(failure.error);
    else {
      console.error('--- first pass ---');
      console.error(failure.firstPass);
      console.error('--- second pass ---');
      console.error(failure.secondPass);
    }
  }
  process.exit(1);
}

console.log(`Fuzz check passed: ${cases.length} cases, seed=${process.env.NUNJUCKS_FUZZ_SEED ?? '20260605'}.`);
