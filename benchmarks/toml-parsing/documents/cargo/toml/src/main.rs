#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| toml::from_str::<toml::Table>(value.as_str().expect("string fixture")),
        |table| table.len() as u32,
        |table| serde_json::to_value(table).expect("table converts to JSON"),
    );
}
