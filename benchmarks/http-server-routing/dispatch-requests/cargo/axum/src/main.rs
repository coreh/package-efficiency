use axum::{Router, body::Body, extract::{Path, Request}, http::{Method, Uri}, routing::get};
use std::{cell::{Cell, RefCell}, convert::Infallible};
use tower_service::Service;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Common result shape: (route label, parameters), or None when no handler ran.
type Hit = Option<(&'static str, Vec<(&'static str, String)>)>;
fn consume(h: &Hit) -> u32 { h.as_ref().map_or(0, |(r, _)| r.len() as u32) }
fn describe(h: &Hit) -> serde_json::Value {
    match h {
        None => serde_json::Value::Null,
        Some((route, params)) => serde_json::json!({"route": route, "params": params.iter().map(|(k, v)| (k.to_string(), serde_json::Value::from(v.clone()))).collect::<serde_json::Map<_, _>>()}),
    }
}

// Operations never overlap, so the handler that ran leaves its answer here.
thread_local! { static OUT: Cell<Hit> = const { Cell::new(None) }; }

const RESOURCES: [&str; 25] = ["users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments",
    "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews",
    "regions", "warehouses", "shipments", "accounts", "webhooks"];

fn label(method: &str, resource: &str, tail: &str) -> &'static str { Box::leak(format!("{method} /api/{resource}{tail}").into_boxed_str()) }

// Not timed: runs once per fixture. The path is escaped as a client sends it
// and parsed, so that an operation only clones the method and the URI.
fn prepare(input: &serde_json::Value) -> (Method, Uri) {
    let mut path = String::new();
    for byte in input["path"].as_str().unwrap().bytes() {
        if byte.is_ascii() { path.push(byte as char) } else { path.push_str(&format!("%{byte:02X}")) }
    }
    (input["method"].as_str().unwrap().parse().unwrap(), path.parse().unwrap())
}

fn main() {
    let mut app = Router::new();
    for r in RESOURCES {
        let (list, create, show, update) = (label("GET", r, ""), label("POST", r, ""), label("GET", r, "/:id"), label("PUT", r, "/:id"));
        // The handler of a parameterized route names its one parameter, as its
        // author would; the value is the framework's, percent-decoded.
        // A handler returns (), axum's empty 200 response.
        app = app
            .route(&format!("/api/{r}"), get(move || async move { OUT.set(Some((list, Vec::new()))) })
                .post(move || async move { OUT.set(Some((create, Vec::new()))) }))
            .route(&format!("/api/{r}/{{id}}"), get(move |Path(id): Path<String>| async move { OUT.set(Some((show, vec![("id", id)]))) })
                .put(move |Path(id): Path<String>| async move { OUT.set(Some((update, vec![("id", id)]))) }));
    }
    // The router is a tower service: call() takes it mutably, as hyper holds it.
    let app: &'static RefCell<Router> = Box::leak(Box::new(RefCell::new(app)));
    let runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
    bench_harness::async_operation::run(
        |main| runtime.block_on(main),
        prepare,
        move |(method, uri): &'static (Method, Uri)| {
            let mut request = Request::new(Body::empty());
            *request.method_mut() = method.clone();
            *request.uri_mut() = uri.clone();
            OUT.set(None);
            let response = app.borrow_mut().call(request);
            async move {
                response.await?;
                Ok::<Hit, Infallible>(OUT.take())
            }
        },
        consume,
        |_, hit| describe(hit),
    );
}
