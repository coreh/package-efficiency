use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let secret = input["secret"].as_str().expect("secret").as_bytes();
            let token = encode(&Header::new(Algorithm::HS256), &input["claims"], &EncodingKey::from_secret(secret))?;
            decode::<Value>(&token, &DecodingKey::from_secret(secret), &Validation::new(Algorithm::HS256)).map(|data| (data.claims, token))
        },
        |(claims, _)| claims.as_object().map_or(0, |map| map.len() as u32),
        // For the verifier only: the claims and the token that was signed.
        |(claims, token)| json!({ "claims": claims, "token": token }),
    );
}
