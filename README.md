# prettier-plugin-nunjucks

[![npm version](https://img.shields.io/npm/v/prettier-plugin-nunjucks.svg)](https://www.npmjs.com/package/prettier-plugin-nunjucks)

Prettier plugin for HTML-heavy [Nunjucks](https://mozilla.github.io/nunjucks/) templates.

It formats `.njk` / `.nunjucks` files with stable, idempotent output and keeps Nunjucks statement tags, variables, comments, whitespace-control markers, and raw/verbatim blocks in the Nunjucks syntax instead of treating them as Handlebars or generic HTML.

## Install

```bash
npm install --save-dev prettier prettier-plugin-nunjucks
```

## Quick Start

Recommended config:

```js
/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["prettier-plugin-nunjucks"],
  overrides: [
    {
      files: ["*.njk", "*.nunjucks"],
      options: {
        parser: "nunjucks",
      },
    },
  ],
};
```

The explicit override makes editor format-on-save deterministic, especially in projects that mix HTML, Nunjucks, Jinja-like templates, and other Prettier plugins.

## Configuration Patterns

### 1. Minimal plugin setup

Use this only after verifying your Prettier/editor resolves `.njk` files to this plugin.

```js
/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["prettier-plugin-nunjucks"],
};
```

### 2. Explicit Nunjucks override

Use this for shared projects and CI.

```js
/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["prettier-plugin-nunjucks"],
  overrides: [
    {
      files: ["src/**/*.{njk,nunjucks}"],
      options: {
        parser: "nunjucks",
      },
    },
  ],
};
```

### 3. Projects with Nunjucks in HTML files

If your project stores Nunjucks templates as `.html`, force the parser for those paths.

```json
{
  "plugins": ["prettier-plugin-nunjucks"],
  "overrides": [
    {
      "files": ["views/**/*.html", "templates/**/*.html"],
      "options": { "parser": "nunjucks" }
    }
  ]
}
```

### 4. Project style options

Normal Prettier options still apply.

```js
/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["prettier-plugin-nunjucks"],
  overrides: [
    {
      files: ["**/*.{njk,nunjucks}"],
      options: {
        parser: "nunjucks",
        printWidth: 100,
        tabWidth: 2,
        singleQuote: true,
        htmlWhitespaceSensitivity: "ignore",
      },
    },
  ],
};
```

### 5. Local plugin path during dogfooding

Useful before publishing a new npm version.

```js
/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["../prettier-plugin-nunjucks/dist/plugin.js"],
  overrides: [
    {
      files: ["**/*.{njk,nunjucks}"],
      options: {
        parser: "nunjucks",
      },
    },
  ],
};
```

## CLI

Published package:

```bash
npx prettier --write "src/**/*.{njk,nunjucks}" --plugin prettier-plugin-nunjucks --parser nunjucks
```

Local plugin build:

```bash
npx prettier --write "src/**/*.{njk,nunjucks}" --plugin ../prettier-plugin-nunjucks/dist/plugin.js --parser nunjucks
```

## API

```js
const prettier = require("prettier");
const plugin = require("prettier-plugin-nunjucks");

async function run(source) {
  return prettier.format(source, {
    filepath: "template.njk",
    parser: "nunjucks",
    plugins: [plugin],
  });
}
```

## What The Plugin Handles Today

- HTML elements, void elements, comments, and custom elements
- Nunjucks variables: `{{ value }}`, including whitespace control `{{- value -}}`
- Nunjucks comments: `{# comment #}`
- statement tags such as `extends`, `include`, `import`, `from`, and custom extension tags
- `if` / `elif` / `elseif` / `else` / `endif`
- `for` / `else` / `endfor`
- `asyncEach` / `endeach` and `asyncAll` / `endall`
- `block` / `endblock`
- `macro` / `endmacro`
- single-statement `set` and block `set` / `endset`
- `filter` / `endfilter`
- `call` / `endcall`
- `raw` / `endraw` and `verbatim` / `endverbatim` preserved verbatim
- Nunjucks inside attribute values
- Nunjucks blocks that emit attributes
- multiline class formatting with conditional modifiers and whitespace-control blocks
- embedded JavaScript / CSS formatting for plain `script` / `style` tags when the content is safe to parse
- raw `script` / `style` preservation when content contains Nunjucks or non-JS/CSS types
- incomplete/unmatched template structures preserved as raw nodes instead of crashing

## Real-World Examples

### Branch chains

```njk
{% if primary %}
  Primary
{% elif secondary %}
  Secondary
{% else %}
  Fallback
{% endif %}
```

### Conditional class values

Input:

```njk
<fieldset class="govuk-fieldset {%- if params.classes %} {{ params.classes }}{% endif %}">
  {{ caller() }}
</fieldset>
```

Output:

```njk
<fieldset
  class="
    govuk-fieldset
    {%- if params.classes %}
      {{ params.classes }}
    {% endif %}
  "
>
  {{ caller() }}
</fieldset>
```

### Blocks that emit attributes

```njk
<button
  {% if disabled %}
    disabled
  {% elif primary %}
    class="primary"
  {% else %}
    data-empty="1"
  {% endif %}
>
  Save
</button>
```

### Raw/verbatim content

```njk
{% raw %}<div>{{ untouched }}</div>{% endraw %}
{% verbatim %}{{ also_untouched }}{% endverbatim %}
```

## Quality Gates

Core check before release:

```bash
npm run check
```

Package/install checks:

```bash
npm run pack:check
npm run smoke:install
npm audit
```

Real-world corpus check:

```bash
npm run build
npm run corpus:oss
```

The OSS corpus currently covers Nunjucks templates from 11ty's base blog, Mozilla's Nunjucks repository, and GOV.UK Frontend. The check formats each file twice and fails on crashes or non-idempotent output.

## Maintainer Release

Run the checks above, then publish from this repository root:

```bash
npm publish --access public
```
