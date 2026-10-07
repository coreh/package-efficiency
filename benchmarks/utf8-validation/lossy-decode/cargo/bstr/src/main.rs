#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;
use serde_json::Value;
use std::convert::Infallible;

// Untimed, once per fixture: the hex string becomes the byte buffer.
fn unhex(v: &Value) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    v.as_str().expect("hex string fixture").as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        unhex,
        |bytes| {
            use bstr::ByteSlice;
            Ok::<String, Infallible>(bytes.to_str_lossy().into_owned())
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.clone()),
    );
}
