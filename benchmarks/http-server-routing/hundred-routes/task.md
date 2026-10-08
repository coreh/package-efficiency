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
- A package whose defaults fail a fixture is entered with its defaults and
  marked as not passing in its notes, and has a second entry with the option
  set: Grape and the Rails router read a dot in `:id` as a format suffix
  (`grape-id-any`, `actionpack-id-any`).

## How deep each entry goes

Servers and frameworks are entered here as well as routers, because most of
them are routers too. They are not all asked at the same depth, and the
figures must be read with that in mind. The rule for an adapter:

1. Ask the question "which handler and which parameters for this method and
   path" in the shallowest way the package documents, through the package
   itself. A private router is never imported to go around the framework.
2. If the framework has a public matcher that answers the whole question, that
   is what is called, and no handler runs.
3. If it has none, the request is dispatched through the application with a
   request object made once per fixture, and the handler that ran records the
   route and its parameters. Then the framework's own request, context and
   reply objects are part of the figure. No handler builds a response: it
   records and returns nothing, or returns one response made at start-up, or
   uses the framework's documented way to skip the response. What the
   framework does by itself on a miss (its 404 or 405) is included, unless a
   not-found handler can be registered like any other handler.
4. No adapter answers from a table of its own. The only lookups in adapter
   code are the ones that rename what the package returned (chi's
   `/api/users/{id}` to the task's label) and the choice of a router by method
   for the two Rust routers that have no methods.
5. Only what can be asked synchronously is here. A framework whose dispatch
   returns a promise or a future is in `dispatch-requests`, the asynchronous
   task of this category with the same routes and requests; it is not wrapped
   to look synchronous.

Which entry is at which depth:

| Depth | Entries |
| --- | --- |
| Public matcher, no handler run | `hono` and `@hono/hono` (`app.router.match`), `find-my-way` (`find`), `gorilla/mux` (`Router.Match`), `go-chi/chi` (`Mux.Find`), `werkzeug` (`MapAdapter.match`), `starlette` and `fastapi` (`Route.matches` in router order), `matchit`, `actix-router` |
| Public matcher, then the matched handler is called | `julienschmidt/httprouter` (`Lookup`), `labstack/echo` (`Router().Route(c)` on a reused context) |
| The framework's own request step, no view called | `flask` (`request_context(environ)` and `match_request()`: Flask's Request and URL adapter around Werkzeug's match), `django` (`resolve(path)`, then the class-based view chooses by method) |
| Dispatch through the application, handler records | `express` and `router` (`handle` with a `next` callback, so no 404 is built), `fastify` (`routing(req, res)`, no-op not-found handler), `elysia` (`fetch`, one shared Response; its own 404 on a miss), `gin-gonic/gin`, `gofiber/fiber`, `emicklei/go-restful`, `zenazn/goji`, `bmizerany/pat` (the HTTP handler with an in-memory writer; their own 404 or 405 on a miss) |
| Dispatch through Rack, response included | `sinatra`, `grape` (handlers return an empty body and the framework builds the response), `roda` and the Rails router (`actionpack`; handlers answer with a ready-made response) |

Notes on single entries:

- Express (5.x) and `router` share the same matching engine; Express adds its
  application layer (query parsing, request setup). Request objects are minimal
  `{ method, url }`; handlers record the matched pattern and `req.params`.
- Fastify's `findRoute` returns the parameters of a match but not which route
  matched, so Fastify is dispatched through `fastify.routing`: the figure is
  find-my-way plus Fastify's Request, Reply and hook chain. `find-my-way` is
  entered beside it as the router alone.
- Elysia keeps static paths in a map and parameterized ones in a Memoirist
  tree; only its compiled `fetch` combines them, so that is what is called. It
  returns synchronously when the handlers are synchronous.
- Hono's `app.router` is the object its `fetch` dispatches with. `hono` (npm)
  and `@hono/hono` (JSR) are two distributions of the same code.
- Starlette and FastAPI: Starlette's `Router` can only be called asynchronously,
  so these two adapters walk the route list themselves and call the public
  `Route.matches(scope)` on each route until one matches fully, which is the
  loop the `Router` runs. This is the one place where adapter code stands in
  for a step of the framework.
- Django's URL patterns have no method. The 100 routes are 50 patterns with a
  class-based view of two methods each, and the view's `dispatch` chooses.
- Roda has no route table: its routes are a tree of Ruby blocks run for each
  request, here `api`, then the 25 resource names in order. `r.put` needs the
  `all_verbs` plugin that ships with the gem.
- The Rails router is used without a Rails application: an
  `ActionDispatch::Routing::RouteSet` from the `actionpack` gem whose routes end
  in Rack endpoints. Controllers, the middleware stack and `rails` itself are
  not loaded.
- `matchit` and `actix-router` have no notion of HTTP methods: the adapters keep
  one router per method and choose it by method. So in the Rust entries a
  request is never matched against 100 routes: the GET router holds 50, the
  POST and PUT routers 25 each, and a method with no router (DELETE) is
  answered by the adapter without a lookup. Express and `router` hold all 100
  in one list. Their parameters are copied into owned strings in the common
  shape.
- A miss is cheap for a tree or a hash and the worst case for a list: Express,
  `router`, Starlette, FastAPI, gorilla/mux and Roda try their routes in order.

Not here, and why:

- `koa` with `@koa/router`, `@oak/oak`, `axum` and `actix-web` dispatch only
  through a promise or a future: they are in `dispatch-requests`.
  `@koa/router` has a synchronous `match()`, but it is marked private.
- `urfave/negroni` is a middleware chain without a router.
- Next.js, Leptos, Dioxus and the other full-stack frameworks of the web
  application category route from files or inside a rendering runtime and have
  no router that can be asked apart from a running application.
- `@http/route`, `@quad/route-pattern`, `@oak/acorn` and `@std/http` (JSR) and
  `memoirist` (Elysia's tree) are routers or have one, and have no adapter yet.
