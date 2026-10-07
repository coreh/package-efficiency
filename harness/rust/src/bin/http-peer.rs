//! A scripted HTTP/1.1 origin: the peer of the http-client tasks.
//! Usage: http-peer <script.json>   (see harness/rust/src/peer.rs for the
//! control channel, and "Client tasks" in benchmarks/README.md)
//!
//! The script lists the routes; nothing else is answered:
//!
//!   { "keepAlive": true,
//!     "routes": [ { "method": "GET", "path": "/items/1",
//!                   "requestBody": null, "requestContentType": null,
//!                   "status": 200, "contentType": "application/json", "body": "{…}" } ] }
//!
//! A request is accepted only if all of this holds; otherwise it is answered
//! with 400, recorded as refused with the reason, and the connection closed:
//!   - the request line is `METHOD SP path SP HTTP/1.1` and names a route;
//!   - every header line is `name: value`, with a token for a name;
//!   - there is exactly one Host header and it is `127.0.0.1:<port>`;
//!   - no Transfer-Encoding and no Expect header (bodies are sized);
//!   - a route with a `requestBody` gets a Content-Length equal to its length,
//!     exactly those bytes, and a Content-Type that starts with
//!     `requestContentType` when the route names one;
//!   - a route without one gets no body (no Content-Length, or 0).
//! A connection that ends inside a request is recorded as refused as well.
//!
//! With `"keepAlive": false` every response carries `Connection: close` and
//! the peer closes the connection after it: a task about new connections.
//! A request that says `Connection: close` is answered the same way.
//! Requests may be pipelined; each is answered in order.

use bench_harness::peer::{self, Record};
use std::io::{Read, Write};
use std::net::TcpStream;

struct Route {
    method: String,
    path: String,
    request_body: Option<Vec<u8>>,
    request_content_type: Option<String>,
    response: Vec<u8>,
    /// The same answer with `Connection: close`, sent before the peer closes.
    closing: Vec<u8>,
}

const MAX_HEAD: usize = 64 * 1024;

fn reason(status: u16) -> &'static str {
    match status {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        404 => "Not Found",
        _ => "Status",
    }
}

fn is_token(name: &str) -> bool {
    !name.is_empty() && name.bytes().all(|b| b.is_ascii_alphanumeric() || b"!#$%&'*+-.^_`|~".contains(&b))
}

/// The route a request head asks for and the length of the body it announces.
fn check_head(head: &str, routes: &[Route], host: &str) -> Result<(usize, usize, bool), String> {
    let mut lines = head.split("\r\n");
    let request_line = lines.next().unwrap_or("");
    let parts: Vec<&str> = request_line.split(' ').collect();
    let [method, target, version] = parts[..] else {
        return Err(format!("malformed request line: {request_line:?}"));
    };
    if version != "HTTP/1.1" {
        return Err(format!("expected HTTP/1.1, got {version:?}"));
    }
    let (mut hosts, mut length, mut content_type, mut close) = (0, None, None, false);
    for line in lines {
        let Some((name, value)) = line.split_once(':') else {
            return Err(format!("malformed header line: {line:?}"));
        };
        if !is_token(name) {
            return Err(format!("malformed header name: {name:?}"));
        }
        let value = value.trim_matches([' ', '\t']);
        match name.to_ascii_lowercase().as_str() {
            "host" => {
                hosts += 1;
                if value != host {
                    return Err(format!("Host is {value:?}, expected {host:?}"));
                }
            }
            "content-length" => {
                if length.is_some() {
                    return Err("more than one Content-Length".into());
                }
                length = Some(value.parse::<usize>().map_err(|_| format!("Content-Length is {value:?}"))?);
            }
            "content-type" => content_type = Some(value.to_ascii_lowercase()),
            "transfer-encoding" => return Err("Transfer-Encoding is not accepted: send a sized body".into()),
            "expect" => return Err("Expect is not accepted".into()),
            "connection" => close = value.eq_ignore_ascii_case("close"),
            _ => {}
        }
    }
    if hosts != 1 {
        return Err(format!("{hosts} Host headers"));
    }
    let Some(index) = routes.iter().position(|r| r.method == method && r.path == target) else {
        return Err(format!("no route for {method} {target}"));
    };
    let route = &routes[index];
    match &route.request_body {
        None if length.unwrap_or(0) != 0 => return Err(format!("{method} {target} takes no body")),
        None => {}
        Some(body) => {
            if length != Some(body.len()) {
                return Err(format!("{method} {target}: Content-Length is {length:?}, expected {}", body.len()));
            }
            if let Some(wanted) = &route.request_content_type {
                if !content_type.as_deref().is_some_and(|got| got.starts_with(wanted.as_str())) {
                    return Err(format!("{method} {target}: Content-Type is {content_type:?}, expected {wanted:?}"));
                }
            }
        }
    }
    Ok((index, length.unwrap_or(0), close))
}

fn serve(mut stream: TcpStream, port: u16, routes: &[Route], keep_alive: bool, record: &Record) {
    let host = format!("127.0.0.1:{port}");
    let refuse = |stream: &mut TcpStream, why: String| {
        let body = format!("{why}\n");
        let _ = stream.write_all(format!("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes());
        record.refused(why);
    };
    let mut buffer: Vec<u8> = Vec::with_capacity(16 * 1024);
    let mut chunk = [0u8; 16 * 1024];
    loop {
        // One request: its head, then as many body bytes as it announced.
        let head_end = loop {
            if let Some(at) = buffer.windows(4).position(|w| w == b"\r\n\r\n") {
                break at;
            }
            if buffer.len() > MAX_HEAD {
                return refuse(&mut stream, "request head over 64 KiB".into());
            }
            match stream.read(&mut chunk) {
                Ok(0) | Err(_) => {
                    if !buffer.is_empty() {
                        record.refused("connection ended inside a request head");
                    }
                    return;
                }
                Ok(n) => buffer.extend_from_slice(&chunk[..n]),
            }
        };
        let Ok(head) = std::str::from_utf8(&buffer[..head_end]) else {
            return refuse(&mut stream, "request head is not UTF-8".into());
        };
        let (index, length, close) = match check_head(head, routes, &host) {
            Ok(found) => found,
            Err(why) => return refuse(&mut stream, why),
        };
        let total = head_end + 4 + length;
        while buffer.len() < total {
            match stream.read(&mut chunk) {
                Ok(0) | Err(_) => return record.refused("connection ended inside a request body"),
                Ok(n) => buffer.extend_from_slice(&chunk[..n]),
            }
        }
        let route = &routes[index];
        if let Some(expected) = &route.request_body {
            if &buffer[head_end + 4..total] != expected.as_slice() {
                return refuse(&mut stream, format!("{} {}: the body is not the scripted one", route.method, route.path));
            }
        }
        buffer.drain(..total);
        // Recorded before the answer leaves, so the record is never behind
        // what the client has seen.
        record.accepted(index);
        let last = !keep_alive || close;
        if stream.write_all(if last { &route.closing } else { &route.response }).is_err() || last {
            return;
        }
    }
}

fn main() {
    let script = peer::script();
    let keep_alive = script["keepAlive"].as_bool().unwrap_or(true);
    let routes: Vec<Route> = script["routes"]
        .as_array()
        .expect("routes")
        .iter()
        .map(|route| {
            let text = |key: &str| route[key].as_str().map(str::to_owned);
            let status = route["status"].as_u64().unwrap_or(200) as u16;
            let body = text("body").unwrap_or_default();
            let mut head = format!("HTTP/1.1 {status} {}\r\n", reason(status));
            if let Some(content_type) = text("contentType") {
                head += &format!("Content-Type: {content_type}\r\n");
            }
            head += &format!("Content-Length: {}\r\n", body.len());
            Route {
                method: text("method").expect("route method"),
                path: text("path").expect("route path"),
                request_body: text("requestBody").map(String::into_bytes),
                request_content_type: text("requestContentType").map(|t| t.to_ascii_lowercase()),
                response: format!("{head}\r\n{body}").into_bytes(),
                closing: format!("{head}Connection: close\r\n\r\n{body}").into_bytes(),
            }
        })
        .collect();
    assert!(!routes.is_empty(), "the script has no routes");
    let routes: &'static [Route] = Box::leak(routes.into_boxed_slice());
    let record: &'static Record = Box::leak(Box::new(Record::new(routes.len())));
    peer::listen(record, move |stream, port| serve(stream, port, routes, keep_alive, record));
}
