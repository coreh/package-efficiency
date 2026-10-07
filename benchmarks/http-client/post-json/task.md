# POST a JSON document

One operation sends `POST /orders/<n>` with a JSON body to a local HTTP/1.1
server, reads the `201` response and returns its JSON body, parsed. There are
8 request bodies of 310 to 831 bytes (an order: nested objects, an array of
lines, strings that are not all ASCII) and 8 responses of about 70 bytes.

The request body is prepared text, the same bytes for every adapter, sent with
`Content-Type: application/json` and a `Content-Length`: serializing the
document is not part of this task (a client that would serialize an object is
handed the text instead). Parsing the response is part of it, as in
[get-json](../get-json/task.md).

The server is the same scripted program as in get-json, in its own process,
not measured. It accepts a request only if the method, the path, the
`Host`, the `Content-Type`, the `Content-Length` and every byte of the body
are the task's; a chunked body is refused. Anything else is answered with
`400`, recorded, and fails the run.

Everything else is as in get-json: eight exchanges in flight on eight lanes,
keep-alive with at most sixteen connections in the whole run, HTTP/1.1 without
pipelining, no TLS, redirects, compression, cookies or retries. An adapter
fails an exchange whose status is not a success, in the way its library does
that.

See [Client tasks](../../README.md#client-tasks) for the method.
