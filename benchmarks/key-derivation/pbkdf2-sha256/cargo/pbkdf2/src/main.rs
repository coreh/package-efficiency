use sha2::Sha256;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let password = value["password"].as_str().expect("password").as_bytes();
            let salt = value["salt"].as_str().expect("salt").as_bytes();
            let rounds = value["iterations"].as_u64().expect("iterations") as u32;
            let length = value["length"].as_u64().expect("length") as usize;
            let mut key = [0u8; 64];
            pbkdf2::pbkdf2_hmac::<Sha256>(password, salt, rounds, &mut key[..length]);
            Ok::<_, std::convert::Infallible>((key, length))
        },
        |(_, length)| *length as u32,
        |(key, length)| serde_json::json!(key[..*length].to_vec()),
    );
}
