#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let input = value.as_str().expect("string fixture");
            data_encoding::BASE64.decode(input.as_bytes())
        },
        |bytes: &Vec<u8>| bytes.len() as u32,
        |bytes| serde_json::json!(bytes),
    );
}
