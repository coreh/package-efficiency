use matchit::Router;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Common result shape: (route label, parameters), or None for no match.
type Hit = Option<(&'static str, Vec<(String, String)>)>;
fn consume(h: &Hit) -> u32 { h.as_ref().map_or(0, |(r, _)| r.len() as u32) }
fn describe(h: &Hit) -> serde_json::Value {
    match h {
        None => serde_json::Value::Null,
        Some((route, params)) => serde_json::json!({"route": route, "params": params.iter().map(|(k, v)| (k.clone(), serde_json::Value::from(v.clone()))).collect::<serde_json::Map<_, _>>()}),
    }
}

fn main() {
    let mut get = Router::new();
    let mut post = Router::new();
    let mut put = Router::new();
    for r in ["users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments",
        "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews",
        "regions", "warehouses", "shipments", "accounts", "webhooks"] {
        let label = |m: &str, tail: &str| -> &'static str { Box::leak(format!("{m} /api/{r}{tail}").into_boxed_str()) };
        get.insert(format!("/api/{r}"), label("GET", "")).unwrap();
        post.insert(format!("/api/{r}"), label("POST", "")).unwrap();
        get.insert(format!("/api/{r}/{{id}}"), label("GET", "/:id")).unwrap();
        put.insert(format!("/api/{r}/{{id}}"), label("PUT", "/:id")).unwrap();
    }
    bench_harness::operation::run_value(|value| {
        let router = match value["method"].as_str().unwrap() { "GET" => &get, "POST" => &post, "PUT" => &put, _ => return Ok::<Hit, String>(None) };
        Ok(match router.at(value["path"].as_str().unwrap()) {
            Ok(m) => Some((*m.value, m.params.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect())),
            Err(_) => None,
        })
    }, consume, describe);
}
