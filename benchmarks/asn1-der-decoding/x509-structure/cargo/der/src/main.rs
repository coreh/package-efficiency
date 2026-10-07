use der::{Class, AnyRef, Decode, Reader, SliceReader, Tagged};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Not timed: prepare() decodes each fixture from hex once.
fn unhex(s: &str) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    s.as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn class(c: Class) -> u32 {
    match c {
        Class::Universal => 0,
        Class::Application => 1,
        Class::ContextSpecific => 2,
        Class::Private => 3,
    }
}

fn walk(bytes: &[u8], out: &mut Vec<u32>) -> der::Result<()> {
    let mut reader = SliceReader::new(bytes)?;
    while !reader.is_finished() {
        let any = AnyRef::decode(&mut reader)?;
        let tag = any.tag();
        out.push(class(tag.class()) * 100 + tag.number().value() as u32);
        if tag.is_constructed() {
            walk(any.value(), out)?;
        }
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
