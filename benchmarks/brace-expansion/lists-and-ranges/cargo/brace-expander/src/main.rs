use brace_expander::BraceExpander;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let expander = BraceExpander::default();
    bench_harness::operation::run_value(
        |value| expander.expand(value.as_str().expect("string fixture")).map_err(|e| e.to_string()),
        |list: &Vec<String>| list.len() as u32,
        |list| serde_json::json!(list),
    );
}
