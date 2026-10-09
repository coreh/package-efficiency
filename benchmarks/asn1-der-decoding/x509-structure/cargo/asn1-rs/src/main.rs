use asn1_rs::{Any, FromDer};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Not timed: prepare() decodes each fixture from hex once.
fn unhex(s: &str) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    s.as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

// Any::from_der reads one element's header and borrows its contents; the
// contents of constructed elements are read again, element by element.
fn walk(bytes: &[u8], out: &mut Vec<u32>) -> Result<(), String> {
    let mut rest = bytes;
    while !rest.is_empty() {
        let (next, any) = Any::from_der(rest).map_err(|e| e.to_string())?;
        out.push(any.header.class() as u32 * 100 + any.header.tag().0);
        if any.header.is_constructed() {
            walk(any.data, out)?;
        }
        rest = next;
    }
    Ok(())
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| unhex(value.as_str().expect("string fixture")),
        |bytes: &Vec<u8>| {
            let mut out = Vec::new();
            walk(bytes, &mut out).map(|()| out)
        },
        |tags| tags.len() as u32,
        |_, tags| json!(tags) as Value,
    );
}
