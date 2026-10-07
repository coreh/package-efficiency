use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, errors::ErrorKind};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<(&'static str, Option<Value>), String> {
            let token = input["token"].as_str().expect("token");
            let secret = input["secret"].as_str().expect("secret").as_bytes();
            Ok(match decode::<Value>(token, &DecodingKey::from_secret(secret), &Validation::new(Algorithm::HS256)) {
                Ok(data) => ("valid", Some(data.claims)),
                Err(error) if matches!(error.kind(), ErrorKind::ExpiredSignature) => ("expired", None),
                Err(_) => ("invalid-signature", None),
            })
        },
        |(_, claims)| claims.as_ref().and_then(|c| c.as_object()).map_or(0, |map| map.len() as u32),
        |(status, claims)| json!({ "status": status, "claims": claims }),
    );
}
