use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |html| Ok::<String, String>(html2md::parse_html(html.as_str().ok_or("html string")?)),
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
