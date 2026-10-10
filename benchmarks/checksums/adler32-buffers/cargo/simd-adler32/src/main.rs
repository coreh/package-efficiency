use serde_json::{Value, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the hex string becomes the buffer's bytes.
fn prepare(input: &Value) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    input.as_str().expect("hex string").as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |bytes| Ok::<_, std::convert::Infallible>(simd_adler32::adler32(&&bytes[..])),
        |v| *v & 0xffff,
        |_, v| json!(v),
    );
}
