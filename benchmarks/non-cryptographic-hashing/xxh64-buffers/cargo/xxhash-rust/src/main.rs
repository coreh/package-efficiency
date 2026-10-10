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
        |bytes| Ok::<_, std::convert::Infallible>(xxhash_rust::xxh64::xxh64(&bytes[..], 0)),
        |h| (*h & 0xffff) as u32,
        // Untimed: an unsigned decimal string, since a JSON number above 2^53
        // would lose its low bits.
        |_, h| json!(h.to_string()),
    );
}
