# http-server-routing / dispatch-requests

One operation hands one request to an application with 100 registered routes,
through the framework's own in-memory entry point, awaits the answer, and
returns which handler ran, with its path parameters, or `null` when none did.

This is the asynchronous companion of `hundred-routes`, for frameworks whose
dispatch returns a promise or a future and so cannot be asked in one
synchronous call. The routes, the 60 requests (40 hits and 20 misses) and the
expected results are those of `hundred-routes`, in the same order, so a figure
here and a figure there are for the same requests. They are not the same
measurement: `hundred-routes` asks for the match in the shallowest way a
package offers, and this task always pays for the whole dispatch.

A correct result is `{ route: "<METHOD> <pattern>", params: { id } }` or `null`.
Parameter values are strings.

## What one operation is

In every adapter, in this order:

1. Outside the measured call, once: the application is created with default
   options and no middleware, and the 100 routes are registered. Each route has
   its own handler.
2. Outside the measured call, once per fixture (`prepare`): the request is
   made, with the path percent-escaped as a client sends it (`ünï` arrives as
   `%C3%BCn%C3%AF`). JavaScript: a `Request` for `http://localhost<path>`, or
   for Koa a minimal `{ method, url, headers }` object. Rust: the parsed method
   and URI, because a request is consumed by the call.
3. Measured: the adapter clears the slot, gives the request to the
   application, and awaits what it returns. Rust builds its request object here
   from the prepared method and URI (an empty body, two clones).
4. The handler that runs writes its route label and the parameters the
   framework gives it into the slot, and ends the request in the cheapest way
   the framework documents: one `Response` made at start-up (Hono, Elysia),
   `ctx.respond = false` (Koa, oak), `()` or `HttpResponse::Ok()` (axum,
   actix-web). No handler builds a body or sets a header.
5. Measured: the adapter returns the slot. Operations never overlap, so one
   slot per process is enough.

Included in the figure: the framework's request, context and reply objects,
reading the path from the URL, routing, parameter decoding, calling the
handler, whatever the framework does around a handler with no middleware, and
on a miss the framework's own 404 or 405 response. Not included: a socket,
HTTP parsing, serializing a response.

## Rules

- One thread. JavaScript on its event loop; axum on a tokio current-thread
  runtime; actix-web on its own `System`, which is a tokio current-thread
  runtime with a local set. No timer and no real waiting anywhere.
- The scheduler's share: the adapter's one `await` per request, plus the
  promises a framework creates itself (Koa and oak run their middleware
  through chains of them; Hono and Elysia answer without one when the handler
  is synchronous), and in Rust one poll of a future that is already finished.
  With handlers that do nothing, the figure is the framework's dispatch
  overhead.
- Rust handlers of a parameterized route take `Path<String>` and name the
  parameter themselves, as a handler's author does. actix-web's `Path` cannot
  give a map of names to values, so both Rust entries use the single-value
  form.
- Koa has no router. It is entered with `@koa/router`, the package this
  site's HTTP server task also uses with it, and the figure is both.

## Entries, and what is not here

`hono`, `@hono/hono` and `elysia` are in both tasks: here through `fetch` and
`handle`, in `hundred-routes` through Hono's public router and Elysia's
synchronous `fetch`. `koa`, `@oak/oak`, `axum` and `actix-web` are only here.

- Express and `router` dispatch through a callback, not a promise, and
  Fastify's `routing` is synchronous: they are in `hundred-routes` only.
  Fastify's promise-returning `inject` is left out because it builds a mock
  Node request and response through `light-my-request`, a cost a served
  request does not have.
- Starlette, FastAPI and the other Python, Ruby and Go packages are not here:
  this kind of task has no runner path for PyPI, RubyGems or Go module
  adapters with a type check yet (see "Asynchronous operations" in
  `benchmarks/README.md`). Starlette's `Router` is the one that would belong.
