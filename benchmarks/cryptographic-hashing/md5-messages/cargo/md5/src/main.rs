#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let input = value.as_str().expect("string fixture");
            Ok::<_, std::convert::Infallible>(md5::compute(input.as_bytes()))
        },
        |digest| digest.0.len() as u32,
        |digest| serde_json::json!(digest.0.iter().collect::<Vec<_>>()),
    );
}
