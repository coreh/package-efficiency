use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Not timed: prepare() decodes each fixture from hex once.
fn unhex(s: &str) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    s.as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| unhex(value.as_str().expect("string fixture")),
        |bytes: &Vec<u8>| Ok::<_, std::convert::Infallible>(infer::get(bytes).map(|kind| kind.mime_type())),
        |mime| mime.map_or(0, |m| m.len() as u32),
        |_, mime| match mime {
            Some(m) => json!(m) as Value,
            None => Value::Null,
        },
    );
}
