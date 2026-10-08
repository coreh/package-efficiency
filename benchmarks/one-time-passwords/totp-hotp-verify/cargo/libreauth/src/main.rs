use libreauth::oath::{HOTPBuilder, TOTPBuilder};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Request {
    secret: String,
    code: String,
    time: i64,
    counter: u64,
}

// Untimed, once per fixture: the JSON object becomes a typed record.
fn prepare(v: &Value) -> Request {
    Request {
        secret: v["secret"].as_str().expect("secret").to_string(),
        code: v["code"].as_str().expect("code").to_string(),
        time: v["time"].as_i64().expect("time"),
        counter: v["counter"].as_u64().expect("counter"),
    }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |r| {
            let hotp = HOTPBuilder::new()
                .base32_key(&r.secret)
                .counter(r.counter)
                .finalize()
                .map_err(|e| format!("{e:?}"))?
                .generate();
            let totp = TOTPBuilder::new()
                .base32_key(&r.secret)
                .timestamp(r.time)
                .positive_tolerance(1)
                .negative_tolerance(1)
                .finalize()
                .map_err(|e| format!("{e:?}"))?;
            Ok::<_, String>((hotp, totp.generate(), totp.is_valid(&r.code)))
        },
        |_| 3,
        |_, out| serde_json::json!([out.0, out.1, out.2]),
    );
}
