#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        Ok({ use base64ct::Encoding; base64ct::Base64::encode_string(input.as_bytes()) })
    });
}
