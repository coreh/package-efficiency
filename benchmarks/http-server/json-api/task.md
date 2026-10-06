# http-server / json-api

Serve a small JSON API over HTTP/1.1 on `127.0.0.1`, on a port the adapter
chooses.

## Routes

| Request | Response |
| --- | --- |
| `GET /` | `200`, `text/plain`, body `Hello, World!` |
| `GET /users/:id` | `200`, `application/json`, body `{"id": <id as a number>, "name": "User <id>"}` |
| `POST /echo` with a JSON body | `200`, `application/json`, body `{"echo": <the parsed body>}` |

JSON bodies are compared after parsing, so key order and whitespace are free.
The exact requests and expected responses are in `scenario.mjs`.

## Rules

- Use the package's own router and its documented way of reading a route
  parameter, parsing a JSON body and sending JSON. No hand-rolled shortcuts
  around the package.
- Default configuration unless the adapter notes state otherwise. No request logging, no compression, no clustering.
- Native Python and Ruby servers use one process, so every server thread is included in CPU/RSS accounting. Uvicorn uses asyncio/h11 on both CPython and PyPy. Go uses its default scheduler.
- **Default and tuned variants.** The entry named for a package runs it exactly
  as installed. A package may also have one tuned variant, a separate entry
  tagged `non-default-options` whose name states the setting. Tuned results
  are what the site shows first: this load is narrow (64 keep-alive
  connections, three small routes), and a default chosen for general use
  should not decide a package's class. Only these may be tuned:
  - worker threads of a thread-pool server (Waitress, Puma): 1, 4, 16 or 64
  - threads running application code in a multi-threaded runtime (Rust async
    runtimes, Go): 1
  - a documented option of the package itself, set through its public API or
    its own environment variable, that needs no extra dependency. Currently:
    Express's ETag and X-Powered-By off. (Elysia's ahead-of-time compilation
    off was tried and was slower on every runtime, so it was not kept.)
  For a setting with several allowed values, the tuned variant uses the one
  with the least CPU per request on the language's first runtime, found with
  `scripts/sweep-setting.mjs`; its note records the value. A tuned variant is
  only kept if it is better than the default. Still not tunable: alternative
  event loops or parsers that are separate packages, and build flags.
- Server-only packages (Uvicorn, Waitress, Puma) use a minimal ASGI, WSGI or Rack application; framework entries use the framework’s router and responses.
- JSON body parsing may be attached to the `POST /echo` route only, or
  globally, whichever the package's documentation shows first.
- Built-in adapters (`builtin/`) route by hand, since there is no router.

## Load

Closed loop, 64 keep-alive connections, equal thirds of the three routes with
`id` varying. An initial warm-up, a full three-round rehearsal in the same process, then three measured rounds; a forced collection
after each round gives the retained heap.

## What is graded

- **CPU time per request** (primary): server process CPU time, user plus
  system, across all threads, divided by requests served. Independent of how
  fast the load generator is.
- **Memory**: package labels grade RSS after the task and GC above the settled
  empty-process baseline. Runtime labels grade total after-task RSS.
  Whole-process lifetime peak RSS is an ungraded diagnostic.

Throughput and latency are recorded but not graded: they depend on the load
generator and on how many cores a server uses.

## Scope

Three routes is a small table. This task does not measure routing cost with
hundreds of routes, middleware stacks, streaming, TLS or HTTP/2.
