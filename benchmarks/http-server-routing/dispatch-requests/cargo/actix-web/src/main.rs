use actix_web::{App, HttpResponse, dev::Service, http::{Method, Uri}, test, web};
use std::cell::Cell;

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
    let mut app = App::new();
    for r in RESOURCES {
        let (list, create, show, update) = (label("GET", r, ""), label("POST", r, ""), label("GET", r, "/:id"), label("PUT", r, "/:id"));
        // The handler of a parameterized route names its one parameter, as its
        // author would; the value is the framework's, percent-decoded.
        // A handler returns HttpResponse::Ok(), an empty 200 response.
        app = app
            .service(web::resource(format!("/api/{r}"))
                .route(web::get().to(move || async move { OUT.set(Some((list, Vec::new()))); HttpResponse::Ok() }))
                .route(web::post().to(move || async move { OUT.set(Some((create, Vec::new()))); HttpResponse::Ok() })))
            .service(web::resource(format!("/api/{r}/{{id}}"))
                .route(web::get().to(move |id: web::Path<String>| async move { OUT.set(Some((show, vec![("id", id.into_inner())]))); HttpResponse::Ok() }))
                .route(web::put().to(move |id: web::Path<String>| async move { OUT.set(Some((update, vec![("id", id.into_inner())]))); HttpResponse::Ok() })));
    }
    // actix-web's own runtime: a single-thread tokio runtime with a local set.
    let system = actix_web::rt::System::new();
    // The application service, as the HTTP layer of a server holds it.
    let service = system.block_on(test::init_service(app));
    let service: &'static _ = Box::leak(Box::new(service));
    bench_harness::async_operation::run(
        |main| system.block_on(main),
        prepare,
        move |(method, uri): &'static (Method, Uri)| {
            let mut request = actix_http::Request::new();
            request.head_mut().method = method.clone();
            request.head_mut().uri = uri.clone();
            OUT.set(None);
            let response = service.call(request);
            async move {
                response.await.map_err(|error| error.to_string())?;
                Ok::<Hit, String>(OUT.take())
            }
        },
        consume,
        |_, hit| describe(hit),
    );
}
