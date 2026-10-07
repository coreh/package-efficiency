# GET a JSON document

One operation sends `GET /items/<id>` to a local HTTP/1.1 server, reads the
response and returns its JSON body, parsed. There are 8 documents of 329 to
622 bytes: an object with strings (some not ASCII), integers, fractions,
booleans, a null, an array of strings and two nested objects.

The server is not a package under test. It is a scripted program
(`harness/rust/src/bin/http-peer.rs`) that the harness starts in its own
process on `127.0.0.1`, on a port the system picks, before the client's
process exists, and stops afterwards. It is the same program for every entry
in every language, and only the client's process is measured. It answers each
route with `200`, `Content-Type: application/json`, a `Content-Length` and the
document, in one write, and keeps the connection open.

What the task fixes:

- **Eight exchanges in flight**, on eight lanes. A lane sends a request, waits
  for the whole response, parses it, and only then sends its next request. In
  JavaScript the lanes are eight asynchronous loops on one event loop; a
  blocking client (Python `http.client`, Ruby `Net::HTTP`, Rust `ureq`) runs
  each lane on its own thread; Go runs eight goroutines; an asynchronous Rust
  client runs eight tasks on the Tokio runtime its adapter builds.
- **Keep-alive.** A client may open at most eight connections in the whole
  run, the verification and warm-up included, and reuses them. The server
  counts the connections it accepts; a run that opened more fails.
- **HTTP/1.1 without pipelining**, plain TCP, no TLS, no proxy, no redirects,
  no compression, no cookies, no retries.

A correct exchange, checked from both ends before anything is measured and
again after every round:

- the client returns a value equal to the document the route serves;
- the server received exactly the requests of the round, each a well-formed
  HTTP/1.1 request for a known route with `Host: 127.0.0.1:<port>` and no
  body. Anything else is answered with `400`, recorded, and fails the run.

An adapter fails an exchange whose status is not 200, in the way its library
does that (an exception, an error, a check of the status). Packages run with
their defaults apart from what keep-alive needs (an agent or pool where the
default is a new connection per request); each adapter's note says which.
Parsing the body is part of the operation, by the library's own JSON method
where it has one and by the language's standard JSON parser otherwise.

The measured figure is CPU time of the client's process, user plus system on
all its threads, per request. Time spent waiting for the server is not CPU
time. The server keeps one thread per connection and does almost nothing per
request, so it is never what a client waits for: its CPU time is recorded
with every round (`peerCpuMs` in the raw results).

By default a Rust or Go client may use every core and a JavaScript client
uses one thread plus whatever its runtime does in the background; all of it
is counted. Throughput therefore has no class.

See [Client tasks](../../README.md#client-tasks) for the method.
