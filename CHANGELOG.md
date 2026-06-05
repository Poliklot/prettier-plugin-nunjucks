# Changelog

## 0.1.2

- Kept multiline Nunjucks variable calls inline with their delimiters, e.g. `{{ render_component({ ... }) }}`, while still normalizing nested object and array indentation.
- Added custom extension tag options: `blockTags`, `inlineTags`, and `forkTags`.
- Added `.nunj` as a recognized Nunjucks file extension.
- Improved wrapped HTML start tags so a broken tag does not leave the closing `>` alone after otherwise inline attributes.
- Added regression tests for large macro calls, custom `remote` / `error` extension tags, `.nunj` registration, and wrapped HTML attributes.

## 0.1.1

- Improved formatting for large Nunjucks macro/function calls with object and array literals.
- Added stable formatting for multiline Nunjucks function-call arguments.
- Normalized indentation inside multiline quoted strings in Nunjucks expressions to keep output idempotent.
- Preserved CDATA sections without re-indenting their content on repeated formatting.
- Preserved very large minified CSS `<style>` blocks instead of invoking embedded CSS formatting when it is not idempotent.
- Expanded OSS corpus validation to 1,125 real-world `.njk` / `.nunjucks` files across 13 public projects, with 0 crashes and 0 non-idempotent files.

## 0.1.0

- Initial Nunjucks Prettier plugin.
- Added HTML-template formatting for Nunjucks variables, statement tags, comments, blocks, branches, and attributes.
- Added support for `if`, `for`, `asyncEach`, `asyncAll`, `block`, `macro`, `set`, `filter`, and `call` block families.
- Preserved `raw` and `verbatim` blocks verbatim.
- Added conditional class formatting for Nunjucks whitespace-control blocks such as `{%- if ... %}`.
- Added parser/format tests, deterministic fuzz checks, pack checks, install smoke checks, and OSS corpus idempotence checks.
- Validated against 204 real-world `.njk` / `.nunjucks` files from 11ty, Mozilla Nunjucks, and GOV.UK Frontend.
