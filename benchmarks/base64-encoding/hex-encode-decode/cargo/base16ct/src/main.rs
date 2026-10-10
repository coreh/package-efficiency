use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the list of byte values becomes a byte vector.
fn prepare(input: &Value) -> Vec<u8> {
    input.as_array().expect("byte list").iter().map(|v| v.as_u64().expect("byte") as u8).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |b: &Vec<u8>| {
            let text = base16ct::lower::encode_string(b);
            let bytes = base16ct::lower::decode_vec(&text)?;
            Ok::<(String, Vec<u8>), base16ct::Error>((text, bytes))
        },
        |(text, bytes): &(String, Vec<u8>)| (text.len() + bytes.len()) as u32,
        |_, (text, bytes)| serde_json::json!([text, bytes]),
    );
}
