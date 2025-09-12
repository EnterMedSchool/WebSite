Glossary highlighting artifacts

What this builds
- public/glossary/index.v1.meta.json: manifest with version, counts, shard list.
- public/glossary/shards/{a..z,0}.json: normalized surface → term IDs for that first letter.
- public/glossary/terms/<id>.json: small preview (title, definition, tags, image).

How to rebuild
- npm run glossary:build

Notes
- Source: https://github.com/EnterMedSchool/Anki/tree/main/glossary/terms via raw GitHub URLs.
- Shards are deterministic and sorted by descending surface length to favor longest-match.
- The output is designed for CDN caching and edge/serverless consumption.

Next steps (suggested)
- Wire a rehype transform to wrap matches server-side using loaded shards.
- Client popover fetches /glossary/terms/<id>.json on hover/click.
- Add denylist + metrics to keep shards small at scale.

