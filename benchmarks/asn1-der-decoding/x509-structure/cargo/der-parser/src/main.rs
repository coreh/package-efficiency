use der_parser::ber::BerObjectContent;
use der_parser::der::{DerObject, parse_der};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Not timed: prepare() decodes each fixture from hex once.
fn unhex(s: &str) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    s.as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn walk(obj: &DerObject, out: &mut Vec<u32>) -> Result<(), String> {
    out.push(obj.header.class() as u32 * 100 + obj.header.tag().0);
    match &obj.content {
        BerObjectContent::Sequence(items) | BerObjectContent::Set(items) => {
            for item in items {
                walk(item, out)?;
            }
        }
        BerObjectContent::Unknown(any) if obj.header.is_constructed() => {
            let mut rest = any.data;
            while !rest.is_empty() {
                let (next, child) = parse_der(rest).map_err(|e| e.to_string())?;
                walk(&child, out)?;
                rest = next;
            }
        }
        _ => {}
    }
    Ok(())
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| unhex(value.as_str().expect("string fixture")),
        |bytes: &Vec<u8>| {
            let (_, obj) = parse_der(bytes).map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            walk(&obj, &mut out).map(|()| out)
        },
        |tags| tags.len() as u32,
        |_, tags| json!(tags) as Value,
    );
}
