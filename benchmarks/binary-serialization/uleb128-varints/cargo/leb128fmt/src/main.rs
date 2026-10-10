use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: decimal strings become u64 values.
fn prepare(input: &Value) -> Vec<u64> {
    input
        .as_array()
        .expect("value list")
        .iter()
        .map(|v| v.as_str().expect("decimal string").parse::<u64>().expect("u64"))
        .collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |values: &Vec<u64>| {
            let mut bytes: Vec<u8> = Vec::with_capacity(10 * values.len());
            for &v in values {
                let (buf, len) = leb128fmt::encode_u64(v).ok_or("encode failed")?;
                bytes.extend_from_slice(&buf[..len]);
            }
            let mut out: Vec<u64> = Vec::with_capacity(values.len());
            let mut pos = 0usize;
            while pos < bytes.len() {
                let v = leb128fmt::decode_uint_slice::<u64, 64>(&bytes, &mut pos)
                    .map_err(|_| "decode failed")?;
                out.push(v);
            }
            Ok::<(Vec<u8>, Vec<u64>), &'static str>((bytes, out))
        },
        |(bytes, values): &(Vec<u8>, Vec<u64>)| (bytes.len() + values.len()) as u32,
        |_, (bytes, values)| {
            serde_json::json!([bytes, values.iter().map(|v| v.to_string()).collect::<Vec<_>>()])
        },
    );
}
