use serde_json::{Value, json};
use simple_asn1::{ASN1Block, ASN1Class, from_der};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Not timed: prepare() decodes each fixture from hex once.
fn unhex(s: &str) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    s.as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn class(c: ASN1Class) -> u32 {
    match c {
        ASN1Class::Universal => 0,
        ASN1Class::Application => 1,
        ASN1Class::ContextSpecific => 2,
        ASN1Class::Private => 3,
    }
}

fn walk(block: &ASN1Block, out: &mut Vec<u32>) {
    use ASN1Block::*;
    let (c, tag) = match block {
        Boolean(..) => (0, 1),
        Integer(..) => (0, 2),
        BitString(..) => (0, 3),
        OctetString(..) => (0, 4),
        Null(..) => (0, 5),
        ObjectIdentifier(..) => (0, 6),
        UTF8String(..) => (0, 12),
        Sequence(..) => (0, 16),
        Set(..) => (0, 17),
        PrintableString(..) => (0, 19),
        TeletexString(..) => (0, 20),
        IA5String(..) => (0, 22),
        UTCTime(..) => (0, 23),
        GeneralizedTime(..) => (0, 24),
        Explicit(cls, _, tag, _) => (class(*cls), u32::try_from(tag).expect("small tag")),
        Unknown(cls, _, _, tag, _) => (class(*cls), u32::try_from(tag).expect("small tag")),
        other => panic!("unexpected block {other:?}"),
    };
    out.push(c * 100 + tag);
    match block {
        Sequence(_, items) | Set(_, items) => items.iter().for_each(|item| walk(item, out)),
        Explicit(_, _, _, inner) => walk(inner, out),
        _ => {}
    }
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| unhex(value.as_str().expect("string fixture")),
        |bytes: &Vec<u8>| {
            from_der(bytes).map(|blocks| {
                let mut out = Vec::new();
                blocks.iter().for_each(|block| walk(block, &mut out));
                out
            })
        },
        |tags| tags.len() as u32,
        |_, tags| json!(tags) as Value,
    );
}
