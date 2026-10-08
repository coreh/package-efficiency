use serde_json::Value;
use totp_rs::{Builder, Secret};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Request {
    secret: String,
    code: String,
    time: u64,
    counter: u64,
}

// Untimed, once per fixture: the JSON object becomes a typed record.
fn prepare(v: &Value) -> Request {
    Request {
        secret: v["secret"].as_str().expect("secret").to_string(),
        code: v["code"].as_str().expect("code").to_string(),
        time: v["time"].as_u64().expect("time"),
        counter: v["counter"].as_u64().expect("counter"),
    }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |r| {
            let secret = Secret::try_from_base32(&r.secret).map_err(|e| format!("{e:?}"))?;
            let totp = Builder::new()
                .with_secret(secret.clone())
                .with_skew(1)
                .build()
                .map_err(|e| format!("{e:?}"))?;
            // The crate has no separate HOTP type: a TOTP with a step of one second, given the counter as the time.
            let hotp = Builder::new()
                .with_secret(secret)
                .with_step_duration(1)
                .build()
                .map_err(|e| format!("{e:?}"))?;
            Ok::<_, String>((hotp.generate(r.counter).to_string(), totp.generate(r.time).to_string(), totp.check(&r.code, r.time).is_some()))
        },
        |_| 3,
        |_, out| serde_json::json!([out.0, out.1, out.2]),
    );
}
