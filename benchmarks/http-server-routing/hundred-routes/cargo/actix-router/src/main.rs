use actix_router::{Path, Router};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Hit = Option<(&'static str, Vec<(String, String)>)>;
fn consume(h: &Hit) -> u32 { h.as_ref().map_or(0, |(r, _)| r.len() as u32) }
fn describe(h: &Hit) -> serde_json::Value {
    match h {
        None => serde_json::Value::Null,
        Some((route, params)) => serde_json::json!({"route": route, "params": params.iter().map(|(k, v)| (k.clone(), serde_json::Value::from(v.clone()))).collect::<serde_json::Map<_, _>>()}),
    }
}

fn build(method: &str, resources: &[&str]) -> Router<&'static str> {
    let mut b = Router::<&'static str>::build();
    for r in resources {
        let label = |tail: &str| -> &'static str { Box::leak(format!("{method} /api/{r}{tail}").into_boxed_str()) };
        if method != "PUT" { b.path(format!("/api/{r}"), label("")); }
        if method != "POST" { b.path(format!("/api/{r}/{{id}}"), label("/:id")); }
    }
    b.finish()
}

fn main() {
    let resources = ["users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments",
        "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews",
        "regions", "warehouses", "shipments", "accounts", "webhooks"];
    let (get, post, put) = (build("GET", &resources), build("POST", &resources), build("PUT", &resources));
    bench_harness::operation::run_value(|value| {
        let router = match value["method"].as_str().unwrap() { "GET" => &get, "POST" => &post, "PUT" => &put, _ => return Ok::<Hit, String>(None) };
        let mut path = Path::new(value["path"].as_str().unwrap());
        Ok(router.recognize(&mut path).map(|(label, _)| (*label, path.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect())))
    }, consume, describe);
}
