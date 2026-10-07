use comfy_table::Table;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn text(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mut table = Table::new();
            table.set_header(value["headers"].as_array().expect("headers").iter().map(text));
            for row in value["rows"].as_array().expect("rows") {
                table.add_row(row.as_array().expect("row").iter().map(text));
            }
            Ok::<String, std::convert::Infallible>(table.to_string())
        },
        |s| s.len() as u32,
        |s| Value::String(s.clone()),
    );
}
