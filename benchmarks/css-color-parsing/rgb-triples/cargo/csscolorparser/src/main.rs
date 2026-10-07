use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| csscolorparser::parse(value.as_str().expect("string fixture")).map(|color| color.to_rgba8()),
        |rgba| u32::from(rgba[3] == 255),
        |rgba| json!([rgba[0], rgba[1], rgba[2]]),
    );
}
