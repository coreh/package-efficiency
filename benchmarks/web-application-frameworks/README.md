# Web application frameworks

One small sample application, a shop with three routes, is written once for
each framework. Four tasks measure that one application:

| Task | What is measured |
| --- | --- |
| `startup` | A new process each time, from launch to its first served dynamic page. |
| `static-page` | `GET /about` under load. |
| `dynamic-page` | `GET /items/:id` under load. |
| `api-route` | `GET /api/items/:id` under load. |

Every task of a framework runs the same built application on the same server.
The application lives in `_shared/<registry>/<name>/`; each task has only a
small `adapter.json` that points at it.

`reference.mjs` is the application as plain functions. It is what the tasks
check against, and it is the authority where this file and it disagree.

## The application

It serves HTTP/1.1 on `127.0.0.1`, on a port of its own choosing, from one
process. There is no database: an item is computed from its id.

### The data

For an item with the integer id `id`:

| Field | Value |
| --- | --- |
| `id` | `id` |
| `name` | `"Item " + id` |
| `priceCents` | `199 + (id * 37) % 5000` |
| `inStock` | `id % 3 != 0` |
| `discountPercent` | `15` when `id % 5 == 0`, otherwise `0` |
| `note` | `Fish & Chips <` + id + `> "quoted" it's` |
| `tags` | the first `(id % 4) + 1` of `alpha`, `beta`, `gamma`, `delta` |
| `related` | twelve items, with the ids `id + 1` to `id + 12`, each with only `id`, `name` and `priceCents` |

A price is shown as `$` and the amount in dollars with two decimals: 236 cents
is `$2.36`.

### `GET /api/items/:id`

`200`, `application/json`. The body is the item as an object with exactly the
fields above, under those names. `related` is an array of objects. JSON is
compared after parsing, so key order and whitespace are free.

### `GET /items/:id`

`200`, `text/html`. The page is rendered for each request, on the server, with
the framework's own templates or components. Somewhere in it is this element,
filled in from the item. This is the template, in Mustache notation: `{{x}}`
is the value of `x` with HTML escaped, `{{#x}}…{{/x}}` is kept when `x` is
true or non-zero and repeated for each member when `x` is a list, `{{^x}}…{{/x}}`
is kept when `x` is false, and `{{.}}` is the member itself.

```html
<main id="bench" data-item="{{id}}">
  <h1>{{name}}</h1>
  <p class="price">{{price}}</p>
  {{#inStock}}<p class="stock">In stock</p>{{/inStock}}
  {{^inStock}}<p class="stock out">Sold out</p>{{/inStock}}
  {{#discountPercent}}<p class="discount">Save {{discountPercent}}%</p>{{/discountPercent}}
  <p class="note">{{note}}</p>
  <ul class="tags">{{#tags}}<li>{{.}}</li>{{/tags}}</ul>
  <table class="related">
    <thead><tr><th>Item</th><th>Price</th></tr></thead>
    <tbody>{{#related}}<tr><td><a href="/items/{{id}}">{{name}}</a></td><td>{{price}}</td></tr>{{/related}}</tbody>
  </table>
  <footer hidden>rendered</footer>
</main>
```

`{{price}}` is the price as shown, of the item or of the related item it is
in. The template has the three things a page template does:

- **Shown or hidden by the data.** One of the two stock lines appears, never
  both. The discount line appears only for an item with a discount.
- **Repeated.** The tags, and the twelve rows of related items.
- **Injected.** Values go into text, into an attribute (`data-item`) and into
  an address (`href`). `note` has `&`, `<`, `>`, a double quote and an
  apostrophe in it, and must come out escaped by the framework's own
  escaping, not by hand.

The `hidden` attribute on the footer is part of the page: the element is sent,
and a browser does not show it.

### `GET /about`

`200`, `text/html`. A page that is the same for every visitor, made the way
the framework makes a static page (prerendered at build time where it can
be). Somewhere in it is exactly this element:

```html
<main id="bench">
  <h1>About this shop</h1>
  <p>This page is the same for every visitor.</p>
  <ul class="facts"><li>One static page</li><li>One dynamic page</li><li>One API route</li></ul>
</main>
```

### What the requests send

Every request carries `Accept-Encoding: gzip, deflate, br`, as a browser's
does. A framework that compresses responses by default therefore compresses
them here, and its body is decompressed before it is compared.

### How a page is compared

A framework wraps a page in its own markup (a document head, scripts, a
layout), and frameworks spell the same HTML differently. So only the element
from `<main id="bench"` to the first `</main>` after it is compared, and both
sides are first brought to one spelling (`harness/html.mjs`): comments are
dropped (and the empty `<!>` that Leptos writes where a list or an optional
piece is filled in, which a browser reads as a comment), the
`data-node-hydration` attribute that Dioxus adds for its client code is
dropped, whitespace between
tags is dropped, `hidden=""` is `hidden`, `<br/>` is `<br>`, the ways of
writing an escaped quote or apostrophe become the character, and `&#38;`,
`&#60;`, `&#62;` become `&amp;`, `&lt;`, `&gt;`. Text that must be escaped
still has to be, in one spelling or the other. Text inside an element is compared as it is: `In stock`
has one space.

## Rules

- **The framework as its documentation says to use it.** Its own router, its
  own templates or components, its own way of returning JSON, its own
  production build and production server. No hand-written shortcut around the
  framework, such as answering a route from a bare HTTP handler.
- **Production mode.** The application is built for production once, before
  anything is measured, and served as built.
- **One process.** CPU and memory are read from the one process the harness
  starts, so the server may not hand requests to worker processes. Threads
  are fine. If the framework's production server forks by default, it is
  configured for a single process and the adapter notes say so.
- **The framework's defaults stay as they are**, compression and caching
  included. If a framework compresses responses or caches something by
  default in production, that is part of what it costs and what it saves, and
  the entry named for the framework keeps it. Nothing is added either: no
  cache or memoization of a rendered page or of an item is written by hand.
  The one exception is request logging, which is off for every framework, as
  in the other server tasks.
- **A tuned variant** may change a documented setting or take out what the
  application does not use, as a separate entry whose name says what it
  changes (for example asynchronous views, or a minimal middleware stack).
  It is a folder beside the default entry in each task, such as
  `pypi/django-async`, whose `adapter.json` points at the same shared
  application and names the variant: `"variant": "async"`, with
  `"tags": ["non-default-options"]`. `prepare` is given that name and
  builds and starts that form. The entry named for the framework alone is
  always the newly generated application with nothing taken out.
- Anything that differs from the framework's defaults or from a newly
  generated application is stated in the adapter record: `notes` is one or
  two sentences for the label, and `details` is the full account, shown on
  the entry's own page.
- **No client behaviour is required.** The pages need no script to be correct;
  what the framework adds for its own client runtime stays as it is.
- Every package is installed at a release at least seven days old, with no
  install scripts, like everything else in this repository.

## Files of one framework

```
_shared/<registry>/<name>/
  prepare.mjs       how to install, build and start it (see below)
  ...               the application's own source, and its adapter
<task>/<registry>/<name>/adapter.json    in each of the four tasks
```

Each task's `adapter.json` is the usual adapter record (author, review,
notes, `runtimes`, `package`) with one more field, `"app"`: the path of the
shared folder, relative to that file's folder, for example
`"../../../_shared/npm/next"`.

`prepare.mjs` exports one function. `scripts/measure.mjs` calls it once per
runtime before it measures a task, and starts what it returns:

```js
export async function prepare({ root, runtimeId, runtime, variant, helpers }) {
  // install (pinned, at least seven days old, no install scripts) and build,
  // skipping what is already done
  return {
    version: '1.2.3',             // the framework's version, as installed
    dependencies: { name: 'x.y.z' },   // what was installed with it, for the record
    install: { kind: 'install', bytes, packages },   // optional: size on disk
    launch: { command, args, cwd, env, phases },     // the server process
    base: { command, args, cwd },  // optional: the same runtime with no application
  }
}
```

- `variant` is the adapter record's `variant`, or null for the defaults.
- `root` is the repository; `runtimeId` and `runtime` are the entry of
  `runtimes.json` being measured (`runtime.bin`, `runtime.args`,
  `runtime.version`).
- `helpers` has what the other adapters are prepared with:
  `installPinned(workdir, packages, overrides)` for npm packages (it applies
  the release-age rule and returns the versions installed), `nodeInstall(workdir)`
  for the size of a `node_modules`, `fromRoot(...parts)`, and the paths of
  the harness runners `jsRunner`, `pythonRunner` and `rubyRunner`.
- `launch` starts one process that speaks the harness protocol on its
  standard output and input, as the runners in `harness/` do: it prints
  `@@{"phase":"boot","pid":…,"memory":{…}}`, then (if `phases` includes
  `loaded`) a `loaded` line, then `@@{"phase":"ready","port":…,"memory":{…}}`
  once the server accepts connections; it answers a `settle` line with a
  `settled` line after collecting garbage; it stops on `exit`. The simplest
  way is to start the existing runner for the language with an adapter that
  starts the framework's server inside that process.
- `base` is needed for a language whose runner takes `-` in place of an
  adapter to measure the runtime alone (Python, Ruby). JavaScript runtimes
  use the shared baseline and leave it out.
