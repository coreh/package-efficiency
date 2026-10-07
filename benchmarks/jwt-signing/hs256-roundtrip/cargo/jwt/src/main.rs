use hmac::{Hmac, Mac};
use jwt::{SignWithKey, VerifyWithKey};
use serde_json::{Value, json};
use sha2::Sha256;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<(Value, String), jwt::Error> {
            let secret = input["secret"].as_str().expect("secret").as_bytes();
            let key: Hmac<Sha256> = Hmac::new_from_slice(secret).expect("hmac key");
            let token = (&input["claims"]).sign_with_key(&key)?;
            let claims: Value = token.verify_with_key(&key)?;
            Ok((claims, token))
        },
        |(claims, _)| claims.as_object().map_or(0, |map| map.len() as u32),
        // For the verifier only: the claims and the token that was signed.
        |(claims, token)| json!({ "claims": claims, "token": token }),
    );
}
