use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Serialize, Deserialize)]
struct Customer {
    name: String,
    age: i64,
    score: f64,
    active: bool,
    nickname: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct Line {
    sku: String,
    qty: i64,
    price: f64,
    gift: bool,
    comment: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct Order {
    id: i64,
    r#ref: String,
    total: f64,
    paid: bool,
    note: Option<String>,
    tags: Vec<String>,
    customer: Customer,
    lines: Vec<Line>,
}

fn short_name<T>(_: &T) -> &'static str {
    let full = std::any::type_name::<T>();
    full.rsplit("::").next().unwrap_or(full)
}

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let record: Order = Order::deserialize(input)?;
            let plain = serde_json::to_value(&record)?;
            Ok::<_, serde_json::Error>((record, plain))
        },
        |(record, _)| record.lines.len() as u32,
        |(record, plain)| {
            json!({
                "classes": [short_name(record), short_name(&record.customer), short_name(&record.lines[0])],
                "customer": record.customer.name,
                "lines": record.lines.len(),
                "first": record.lines[0].sku,
                "plain": Value::clone(plain),
            })
        },
    );
}
