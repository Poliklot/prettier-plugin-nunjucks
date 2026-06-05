# Changelog

## 0.1.0

- Initial Nunjucks Prettier plugin.
- Added HTML-template formatting for Nunjucks variables, statement tags, comments, blocks, branches, and attributes.
- Added support for `if`, `for`, `asyncEach`, `asyncAll`, `block`, `macro`, `set`, `filter`, and `call` block families.
- Preserved `raw` and `verbatim` blocks verbatim.
- Added conditional class formatting for Nunjucks whitespace-control blocks such as `{%- if ... %}`.
- Added parser/format tests, deterministic fuzz checks, pack checks, install smoke checks, and OSS corpus idempotence checks.
- Validated against 204 real-world `.njk` / `.nunjucks` files from 11ty, Mozilla Nunjucks, and GOV.UK Frontend.
