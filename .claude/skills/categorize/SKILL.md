---
name: categorize
description: Fetch the top N npm packages by downloads and sort them into benchmark categories (functional equivalence classes). Use when asked to "run the categorization", re-categorize, or expand the package set to a larger N.
---

# Run the categorization

Categorizes the top N packages of an ecosystem so each category can later get
one standard benchmark. npm is the default; the scripts take
`--ecosystem=cargo|pypi|rubygems|gomod|jsr` for the others, and all ecosystems
share one taxonomy. Incremental: packages already in `data/categories.json` are skipped
and existing taxonomy ids are preserved, so re-running with a larger N only
pays for the new packages. The exception is packages in `other`, which are
retried on every run because a larger package set may give them peers.

Arguments: optional ecosystems (default npm), an optional package count (default: keep the current
`data/packages.json`, or 100 if it does not exist), and optionally "from
scratch" to redo everything.

## Steps

Run from the repo root.

1. **Fetch** (skip when no count was given and `data/packages.json` exists):
   `node scripts/fetch-top.mjs <N> [--ecosystem=<id>]`
2. **Prepare batches**: `node scripts/prepare-batches.mjs [--ecosystem=<id>]`,
   once per ecosystem
   - Add `--all` when asked to redo from scratch. In that case also delete
     `data/taxonomy.json` and `data/categories.json` first, after confirming
     with the user, since the taxonomy ids will change.
   - The default batch size is 50. When that would give more than about 12
     batches, raise it with `--batch-size=` (up to 100) to limit agent count.
   - It prints `{"ecosystem", "title", "dir", "total", "pending", "batchCount"}`. If `pending` is 0, report
     that everything is already categorized and stop.
3. **Run the workflow**: call the Workflow tool with
   `scriptPath: ".claude/workflows/categorize-packages.js"` and `args` set to
   the JSON object printed in step 2 (as an object, not a string), or to
   `{"ecosystems": [...]}` holding one such object per ecosystem. Sonnet
   categorizes the batches; the taxonomy step uses the session model.
4. **Merge** once the workflow completes: `node scripts/merge-categories.mjs [--ecosystem=<id>]`,
   once per ecosystem
   - If it lists `missing` packages or `problems`, run steps 2-4 once more;
     only the missing packages are re-batched. Report anything still missing
     after the second pass instead of looping.
5. **Record candidates** in `data/candidate-categories.json`: merge the
   workflow's `suggestions` into the existing entries (same id or same idea
   means add the packages, not a new entry), keeping only packages currently
   in `other`. Drop candidates that now exist in `data/taxonomy.json`. Do not
   add candidates to the taxonomy without being asked.
6. **Report**, briefly:
   - categories by size, flagging which are benchmarkable and have 3 or more
     members (the candidates for a standard benchmark)
   - low-confidence packages
   - category suggestions returned by the workflow
   - point to `data/categories.md` for the full listing

## Files

| File | Role |
| --- | --- |
| `data/packages.json` | top N npm packages, ordered by monthly downloads |
| `data/<ecosystem>/` | the same files for another ecosystem: `packages.json`, `categories.json`, `categories.md`, `batches/`. crates.io and RubyGems are ordered by total downloads, PyPI by monthly downloads, JSR by downloads in the last 90 days; Go modules publish no download counts and are ordered by dependent repositories |
| `data/taxonomy.json` | shared by all ecosystems. Categories: id, description, benchmarkable, benchmarkIdea |
| `data/categories.json` | package name to category, confidence, note |
| `data/categories.md` | generated readable report |
| `data/candidate-categories.json` | categories suggested but not yet adopted, with their members in `other` |
| `data/batches/` | scratch input and output for the workflow; safe to delete |

`data/taxonomy.json` is meant to be hand-edited between runs: rename titles,
merge or split categories, sharpen a `benchmarkIdea`. If an id is removed or
split, delete the affected entries from `data/categories.json` so the next run
re-categorizes them.
