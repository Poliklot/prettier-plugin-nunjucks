# OSS corpus checks

The OSS corpus command clones representative Nunjucks projects and runs crash/idempotence checks over `.njk` and `.nunjucks` files.

```bash
npm run build
npm run corpus:oss
```

Current built-in corpus:

| Project | Files | Why it is useful |
| --- | ---: | --- |
| `a11yproject/a11yproject.com` | 78 | Production Eleventy/Nunjucks accessibility site. |
| `GoogleChrome/web.dev` | 252 | Large web platform content site with complex demos and embedded CSS/JS. |
| `jamstack/jamstack.org` | 85 | Large Jamstack site with macro-heavy includes. |
| `11ty/eleventy-base-blog` | 9 | Canonical Eleventy starter templates. |
| `11ty/11ty-website` | 115 | Eleventy documentation site. |
| `ipld/ipld` | 4 | Documentation templates. |
| `stefanjudis/tiny-helpers` | 7 | Eleventy utility site templates. |
| `Andy-set-studio/hylia` | 22 | Eleventy starter with RSS/CDATA templates. |
| `alphagov/govuk-design-system` | 303 | Large GOV.UK design-system examples with macro object literals. |
| `alphagov/govuk-frontend` | 161 | Production GOV.UK component templates with dense class/attribute logic. |
| `madrilene/eleventy-excellent` | 41 | Eleventy starter/theme templates. |
| `danurbanowicz/eleventy-netlify-boilerplate` | 14 | Eleventy boilerplate templates. |
| `mozilla/nunjucks` | 34 | Fixtures/examples from the Nunjucks project itself. |
| **Total** | **1,125** | **0 crashes, 0 non-idempotent files in the latest local run.** |

Latest local run on 2026-06-05:

| Metric | Result |
| --- | ---: |
| Files checked | 1,125 |
| Crashes | 0 |
| Non-idempotent files | 0 |

For local projects:

```bash
npm run build
npm run corpus:check -- /path/to/views
```
