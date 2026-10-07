//! The sample application with no framework: hyper's HTTP/1 connection
//! handling, a `match` on the path for a router, and pages built by pushing
//! onto a `String`. Rust's standard library has no HTTP server, so hyper (the
//! layer axum and most other Rust frameworks sit on) stands where node:http
//! and net/http stand for the other languages.
use std::convert::Infallible;
use std::fmt::Write;
use std::sync::LazyLock;

use http_body_util::Full;
use hyper::body::{Bytes, Incoming};
use hyper::header::{CONTENT_TYPE, HeaderValue};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Method, Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use serde::Serialize;
use tokio::net::TcpListener;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const TAGS: [&str; 4] = ["alpha", "beta", "gamma", "delta"];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Related {
    id: u64,
    name: String,
    price_cents: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Item {
    id: u64,
    name: String,
    price_cents: u64,
    in_stock: bool,
    discount_percent: u64,
    note: String,
    tags: &'static [&'static str],
    related: Vec<Related>,
}

fn price_cents(id: u64) -> u64 {
    199 + (id * 37) % 5000
}

fn item(id: u64) -> Item {
    Item {
        id,
        name: format!("Item {id}"),
        price_cents: price_cents(id),
        in_stock: id % 3 != 0,
        discount_percent: if id % 5 == 0 { 15 } else { 0 },
        note: format!("Fish & Chips <{id}> \"quoted\" it's"),
        tags: &TAGS[..(id % 4) as usize + 1],
        related: (id + 1..=id + 12).map(|id| Related { id, name: format!("Item {id}"), price_cents: price_cents(id) }).collect(),
    }
}

fn push_price(out: &mut String, cents: u64) {
    write!(out, "${}.{:02}", cents / 100, cents % 100).unwrap();
}

fn push_escaped(out: &mut String, text: &str) {
    for c in text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            c => out.push(c),
        }
    }
}

fn layout(title: &str, main: impl FnOnce(&mut String)) -> String {
    let mut out = String::with_capacity(2048);
    out.push_str("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>");
    push_escaped(&mut out, title);
    out.push_str("</title></head><body>");
    main(&mut out);
    out.push_str("</body></html>");
    out
}

// The static page is one constant, put together the first time it is asked for.
static ABOUT: LazyLock<Bytes> = LazyLock::new(|| {
    Bytes::from(layout("About this shop", |out| {
        out.push_str("<main id=\"bench\"><h1>About this shop</h1><p>This page is the same for every visitor.</p><ul class=\"facts\"><li>One static page</li><li>One dynamic page</li><li>One API route</li></ul></main>")
    }))
});

fn item_page(it: &Item) -> String {
    layout(&it.name, |out| {
        write!(out, "<main id=\"bench\" data-item=\"{}\"><h1>", it.id).unwrap();
        push_escaped(out, &it.name);
        out.push_str("</h1><p class=\"price\">");
        push_price(out, it.price_cents);
        out.push_str("</p>");
        out.push_str(if it.in_stock { "<p class=\"stock\">In stock</p>" } else { "<p class=\"stock out\">Sold out</p>" });
        if it.discount_percent != 0 {
            write!(out, "<p class=\"discount\">Save {}%</p>", it.discount_percent).unwrap();
        }
        out.push_str("<p class=\"note\">");
        push_escaped(out, &it.note);
        out.push_str("</p><ul class=\"tags\">");
        for tag in it.tags {
            out.push_str("<li>");
            push_escaped(out, tag);
            out.push_str("</li>");
        }
        out.push_str("</ul><table class=\"related\"><thead><tr><th>Item</th><th>Price</th></tr></thead><tbody>");
        for r in &it.related {
            write!(out, "<tr><td><a href=\"/items/{}\">", r.id).unwrap();
            push_escaped(out, &r.name);
            out.push_str("</a></td><td>");
            push_price(out, r.price_cents);
            out.push_str("</td></tr>");
        }
        out.push_str("</tbody></table><footer hidden>rendered</footer></main>");
    })
}

fn send(status: StatusCode, content_type: &'static str, body: impl Into<Bytes>) -> Response<Full<Bytes>> {
    let mut response = Response::new(Full::new(body.into()));
    *response.status_mut() = status;
    response.headers_mut().insert(CONTENT_TYPE, HeaderValue::from_static(content_type));
    response
}

const HTML: &str = "text/html; charset=utf-8";

async fn handle(request: Request<Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    let path = request.uri().path();
    let id = |prefix: &str| path.strip_prefix(prefix).and_then(|rest| rest.parse::<u64>().ok());
    Ok(if request.method() != Method::GET {
        send(StatusCode::METHOD_NOT_ALLOWED, "text/plain", "Method not allowed")
    } else if path == "/about" {
        send(StatusCode::OK, HTML, ABOUT.clone())
    } else if let Some(id) = id("/items/") {
        send(StatusCode::OK, HTML, item_page(&item(id)))
    } else if let Some(id) = id("/api/items/") {
        send(StatusCode::OK, "application/json", serde_json::to_vec(&item(id)).unwrap())
    } else {
        send(StatusCode::NOT_FOUND, "text/plain", "Not found")
    })
}

#[tokio::main]
async fn main() {
    bench_harness::boot();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    bench_harness::ready(listener.local_addr().unwrap().port());
    loop {
        let (stream, _) = listener.accept().await.unwrap();
        tokio::spawn(async move {
            // A connection that ends in an error (the client went away) is just closed.
            let _ = http1::Builder::new().serve_connection(TokioIo::new(stream), service_fn(handle)).await;
        });
    }
}
