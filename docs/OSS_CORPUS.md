# OSS corpus checks

The OSS corpus command clones representative Nunjucks projects and runs crash/idempotence checks over `.njk` and `.nunjucks` files.

```bash
npm run build
npm run corpus:oss
```

Current built-in corpus:

| Project | Why it is useful |
| --- | --- |
| `11ty/eleventy-base-blog` | Real Eleventy templates and front-end includes. |
| `mozilla/nunjucks` | Fixtures/examples from the Nunjucks project itself. |
| `alphagov/govuk-frontend` | Large production component templates with dense class/attribute logic. |

Latest local run on 2026-06-05:

| Project | Files | Crashes | Non-idempotent |
| --- | ---: | ---: | ---: |
| `11ty/eleventy-base-blog` | 9 | 0 | 0 |
| `mozilla/nunjucks` | 34 | 0 | 0 |
| `alphagov/govuk-frontend` | 161 | 0 | 0 |
| **Total** | **204** | **0** | **0** |

For local projects:

```bash
npm run build
npm run corpus:check -- /path/to/views
```
