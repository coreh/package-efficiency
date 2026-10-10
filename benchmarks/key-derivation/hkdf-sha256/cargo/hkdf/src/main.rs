use hkdf::Hkdf;
use sha2::Sha256;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    ikm: Vec<u8>,
    salt: Vec<u8>,
    info: Vec<u8>,
    length: usize,
}

fn unhex(value: &serde_json::Value) -> Vec<u8> {
    let text = value.as_str().expect("hex string");
    (0..text.len()).step_by(2).map(|i| u8::from_str_radix(&text[i..i + 2], 16).expect("hex")).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| Input {
            ikm: unhex(&value["ikm"]),
            salt: unhex(&value["salt"]),
            info: unhex(&value["info"]),
            length: value["length"].as_u64().expect("length") as usize,
        },
        |input| {
            let mut okm = vec![0u8; input.length];
            Hkdf::<Sha256>::new(Some(&input.salt), &input.ikm).expand(&input.info, &mut okm)?;
            Ok::<_, hkdf::InvalidLength>(okm)
        },
        |okm| okm.len() as u32,
        |_, okm| serde_json::json!(okm.iter().map(|b| format!("{b:02x}")).collect::<String>()),
    );
}
