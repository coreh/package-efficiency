# client-side-routing / nested-branches

One operation takes a URL path (a string) and returns the branch of nested
routes it matches, root first, with the path parameters, or `null` when no route
matches.

The route tree has 17 sections, each a layout route `/<section>` with children:
an index route, `new`, and `:id`; `:id` has children `edit` and
`comments/:commentId`. That is 6 routes per section, 102 in all. Every route has
a unique id: `<section>`, `<section>:index`, `<section>:new`, `<section>:detail`,
`<section>:edit`, `<section>:comment`. The tree is built once, outside the
measured call, in every adapter.

A correct result is `{ branch: [ids, root first], params: { ... } }` or `null`.
Parameter values are strings, merged across the whole branch. For example
`/teams/42/comments/9` gives branch `teams`, `teams:detail`, `teams:comment`
and params `{ id: "42", commentId: "9" }`; `/teams/new` gives `teams`,
`teams:new` (a static segment beats `:id`); `/teams` gives `teams`,
`teams:index`; `/teams/42` gives `teams`, `teams:detail`. Packages that return
other shapes are mapped to this one inside the call, in every adapter alike.

Fixtures are 60 paths: hits on each route shape with ids containing letters,
dashes, dots, digits and non-ASCII, and misses (unknown section, extra segment,
incomplete `comments`, the root). Paths have no query string, hash, trailing
slash, percent escapes or case differences, since packages differ on those
defaults.

Rules:

- Packages run with default settings; no loaders, components or navigation are
  involved, only matching.
- `react-router` returns no matches for a miss. `vue-router` has no "no match"
  result without a console warning, so its tree carries the documented catch-all
  `/:pathMatch(.*)*` route and the adapter reports `null` when only that route
  matched.
- `react-router` uses `matchRoutes`; `vue-router` uses `router.resolve` on a
  router with memory history. Navigation is not performed.
