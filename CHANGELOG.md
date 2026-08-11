# Changelog

## [0.1.8](https://github.com/Poliklot/prettier-plugin-nunjucks/compare/prettier-plugin-nunjucks-v0.1.7...prettier-plugin-nunjucks-v0.1.8) (2026-08-11)


### Bug Fixes

* **ci:** support trusted manual npm publishing ([fe00e80](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/fe00e80a5905318aa7861a8e587b19c9d00c7199))
* **deps-dev:** update development dependencies ([99f7ba2](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/99f7ba2bdd0d695d99cead0e56ef8c9c8ba2f505))
* keep long Nunjucks logical chains multiline ([27c3b87](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/27c3b874d32944fddf5edccb2184de425cfed403))
* preserve front matter blocks ([#11](https://github.com/Poliklot/prettier-plugin-nunjucks/issues/11)) ([75bbabd](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/75bbabdad304a27735a287bedc30626a20754e94))

## [0.1.7](https://github.com/Poliklot/prettier-plugin-nunjucks/compare/prettier-plugin-nunjucks-v0.1.6...prettier-plugin-nunjucks-v0.1.7) (2026-08-11)


### Bug Fixes

* **ci:** support trusted manual npm publishing ([fe00e80](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/fe00e80a5905318aa7861a8e587b19c9d00c7199))

## [0.1.6](https://github.com/Poliklot/prettier-plugin-nunjucks/compare/prettier-plugin-nunjucks-v0.1.5...prettier-plugin-nunjucks-v0.1.6) (2026-07-27)

### Bug Fixes

* update TypeScript, Prettier, and Node.js development types

## [0.1.5](https://github.com/Poliklot/prettier-plugin-nunjucks/compare/prettier-plugin-nunjucks-v0.1.4...prettier-plugin-nunjucks-v0.1.5) (2026-07-20)


### Bug Fixes

* preserve front matter blocks ([#11](https://github.com/Poliklot/prettier-plugin-nunjucks/issues/11)) ([75bbabd](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/75bbabdad304a27735a287bedc30626a20754e94))

## [0.1.4](https://github.com/Poliklot/prettier-plugin-nunjucks/compare/prettier-plugin-nunjucks-v0.1.3...prettier-plugin-nunjucks-v0.1.4) (2026-06-17)


### Bug Fixes

* keep long Nunjucks logical chains multiline ([27c3b87](https://github.com/Poliklot/prettier-plugin-nunjucks/commit/27c3b874d32944fddf5edccb2184de425cfed403))

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
