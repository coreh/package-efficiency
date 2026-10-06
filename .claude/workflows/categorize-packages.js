export const meta = {
  name: 'categorize-packages',
  description: 'Build or extend the package taxonomy, then categorize pending package batches',
  whenToUse: 'After scripts/prepare-batches.mjs; pass its JSON output as args',
  phases: [
    { title: 'Taxonomy', detail: 'create or extend data/taxonomy.json, one ecosystem after another' },
    { title: 'Categorize', detail: 'one agent per batch file, all ecosystems at once', model: 'sonnet' },
  ],
}

// args: what scripts/prepare-batches.mjs printed, { ecosystem, title, dir,
// total, pending, batchCount }, for one ecosystem, or { ecosystems: [...] }
// with one such object per ecosystem. The taxonomy is shared by all of them.
const runs = (args?.ecosystems ?? (args ? [args] : []))
  .map((run) => ({ ecosystem: 'npm', title: 'npm', dir: 'data', ...run }))
  .filter((run) => run.batchCount > 0)
if (runs.length === 0) {
  log('No pending packages; nothing to categorize.')
  return { batches: 0, written: 0, failedBatches: [], suggestions: [] }
}
const pending = runs.reduce((sum, run) => sum + run.pending, 0)

phase('Taxonomy')
// One ecosystem at a time: each run extends what the previous one wrote.
const taxonomies = []
for (const run of runs) {
const taxonomy = await agent(
  `You are maintaining the category taxonomy for a project that gives software
packages an efficiency label (memory and CPU footprint), like the EU energy
label. The taxonomy is shared by several package ecosystems (npm, crates.io,
PyPI, RubyGems, Go modules, JSR), because packages are compared across
languages. This run adds the ${run.title} packages.

Packages are only comparable within a category, so a category must be a
FUNCTIONAL EQUIVALENCE CLASS: every member can perform the same standard task,
so one benchmark can be written per category and run against each member
through a thin adapter. "Utilities" is useless; "glob matching" is good.

Read ${run.dir}/packages.tsv in full (one ${run.title} package per line: name,
description, keywords, tab-separated, most used first; some descriptions are
empty, so judge those by name). Read data/taxonomy.json if it exists.

Write data/taxonomy.json as:
{ "categories": [ {
    "id": "kebab-case-id",
    "group": "id of one of the groups listed in the file's top-level \"groups\"",
    "title": "Short title",
    "description": "One sentence: what members do, and what is out of scope.",
    "benchmarkable": true,
    "benchmarkIdea": "One sentence: the standard task every member could run.",
    "examples": ["pkg-a", "pkg-b"]
} ] }

Rules:
- If data/taxonomy.json exists, keep every existing category, in the same
  order, with its id and meaning unchanged, and keep any other top-level key
  of the file exactly as it is. Only add categories that this package list
  needs and the taxonomy lacks.
- Every category names its group: one of the ids in the top-level "groups"
  list (sections such as "Web and networking"). Categories that are not
  benchmarkable go in "not-comparable". Add a group only when a new category
  fits none of them.
- A package belongs in an existing category whenever it could run that
  category's task, whatever language it is written in. Do not add a
  per-language copy of an existing category.
- Add a category only when at least 3 packages in this list would be members.
  Prefer splitting by task over splitting by ecosystem. Add at most about 25
  categories in this run; fewer is better.
- Packages with no comparable runtime task go into categories with
  "benchmarkable": false and no benchmarkIdea. Use these for: type-only
  packages, build/lint/test tooling and its plugins and configs, frameworks
  and other packages too broad for one task, platform-specific binaries, and
  whatever this ecosystem has of the same kind (for example procedural macro
  support, bindings to system libraries, type stubs, service SDKs).
- Always include a non-benchmarkable category with id "other" for packages
  that are benchmarkable in principle but have no peers in the list yet.
- Keep the whole taxonomy small enough to hold in mind. It grows as
  ecosystems are added, but should stay well under 150 categories.

Return the number of categories and the ids you added in this run.`,
  {
    label: `taxonomy: ${run.title}`,
    phase: 'Taxonomy',
    schema: {
      type: 'object',
      properties: {
        categoryCount: { type: 'integer' },
        added: { type: 'array', items: { type: 'string' } },
      },
      required: ['categoryCount', 'added'],
    },
  },
)
if (!taxonomy) throw new Error(`Taxonomy agent failed for ${run.title}; data/taxonomy.json may be missing or stale.`)
log(`${run.title}: taxonomy has ${taxonomy.categoryCount} categories (${taxonomy.added.length} added)`)
taxonomies.push({ ecosystem: run.ecosystem, ...taxonomy })
}

phase('Categorize')
const batches = runs.flatMap((run) => Array.from({ length: run.batchCount }, (_, i) => ({ run, i })))
const results = await parallel(
  batches.map(({ run, i }) => () =>
    agent(
      `Assign each ${run.title} package in ${run.dir}/batches/batch-${i}.tsv to exactly one
category from data/taxonomy.json. Read both files in full first. The batch file
has one package per line: name, description, keywords, tab-separated. Some
descriptions are empty.

A category is a functional equivalence class: members can all run the same
benchmark task. Choose the category whose benchmarkIdea the package could
actually implement, whatever language the category's examples are written in.
Judge by what the package does, not by its name. If you do
not recognize a package and its description is not enough, set confidence to
"low" rather than guessing confidently. Use "other" when nothing fits; never
invent a category id.

Write ${run.dir}/batches/out/batch-${i}.json as a JSON array with one entry per line
of the batch file, in the same order:
[ { "name": "<exact package name>", "category": "<taxonomy id>",
    "confidence": "high" | "low", "note": "<only when low or 'other': why>" } ]

Return how many entries you wrote, and any category you think the taxonomy is
missing (only when 2 or more packages in this batch would belong to it).`,
      {
        label: `${run.ecosystem} batch ${i}`,
        phase: 'Categorize',
        model: 'sonnet',
        schema: {
          type: 'object',
          properties: {
            written: { type: 'integer' },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  reason: { type: 'string' },
                  packages: { type: 'array', items: { type: 'string' } },
                },
                required: ['id', 'reason', 'packages'],
              },
            },
          },
          required: ['written', 'suggestions'],
        },
      },
    ),
  ),
)

const failedBatches = results.flatMap((r, n) => (r ? [] : [`${batches[n].run.ecosystem} ${batches[n].i}`]))
if (failedBatches.length) log(`Batches with no result: ${failedBatches.join(', ')}`)
const written = results.filter(Boolean).reduce((sum, r) => sum + r.written, 0)
log(`Categorized ${written}/${pending} pending packages`)

return {
  batches: batches.length,
  written,
  failedBatches,
  taxonomies,
  suggestions: results.filter(Boolean).flatMap((r) => r.suggestions),
}
