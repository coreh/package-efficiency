# http-server-routing / hundred-routes

One operation takes a request `{ method, path }` and returns which of 100
registered routes handled it, with its path parameters, or `null` when no route
matches.

Routes: 25 resource names, each with `GET /api/<r>`, `POST /api/<r>`,
`GET /api/<r>/:id` and `PUT /api/<r>/:id`. Registration happens once, outside
the measured call, in every adapter. The 60 fixtures mix hits on each route
shape, ids with letters, dashes, dots, digits and non-ASCII, wrong methods
(405-like, reported as no match), unknown resources, extra segments and the
root. 40 of the 60 are hits and 20 are misses. A miss is the worst case for
Express and `router`, which try all 100 routes in order before giving up, so
that case weighs a third of their figure.

A correct result is `{ route: "<METHOD> <pattern>", params: { id } }` or `null`.
Parameter values are strings. Packages that return other shapes are mapped to
this one inside the call, in every adapter alike.

Scope and rules:

- Packages run with default settings. No middleware is registered; this
  measures the router, not middleware stacks, request parsing or responses.
- Paths contain no query strings, trailing slashes, percent escapes or case
  differences, since packages differ on those defaults.
- Express (5.x) and `router` share the same matching engine; Express adds its
  application layer (query parsing, request setup). Request objects are minimal
  `{ method, url }`; handlers record the matched pattern and `req.params`.
- Express and `router` run handlers synchronously, so one call can return the
  match. oak and the other frameworks that dispatch only through async
  `Request`/`Response` are left out, as are axum (tower services are async) and
  JSR packages without a synchronous matcher. Hono is left out too, but not for
  that reason: besides its async `fetch` dispatch it ships router classes with
  a synchronous `match(method, path)`, which could be given an adapter here; it
  has none yet.
- `matchit` and `actix-router` have no notion of HTTP methods: the adapters keep
  one router per method and choose it by method. So in the Rust entries a
  request is never matched against 100 routes: the GET router holds 50, the
  POST and PUT routers 25 each, and a method with no router (DELETE) is
  answered by the adapter without a lookup. Express and `router` hold all 100
  in one list. Their parameters are copied into owned strings in the common
  shape.
