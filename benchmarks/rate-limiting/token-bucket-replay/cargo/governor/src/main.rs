use governor::clock::FakeRelativeClock;
use governor::{Quota, RateLimiter};
use serde_json::{Value, json};
use std::num::NonZeroU32;
use std::time::Duration;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<Vec<bool>, String> {
            let rate = NonZeroU32::new(input["rate"].as_u64().ok_or("rate")? as u32).ok_or("rate")?;
            let burst = NonZeroU32::new(input["burst"].as_u64().ok_or("burst")? as u32).ok_or("burst")?;
            let keys = input["keys"].as_array().ok_or("keys")?;
            let times = input["times"].as_array().ok_or("times")?;
            let clock = FakeRelativeClock::default();
            let limiter = RateLimiter::hashmap_with_clock(Quota::per_second(rate).allow_burst(burst), clock.clone());
            let mut now = 0u64;
            let mut out = Vec::with_capacity(keys.len());
            for (key, time) in keys.iter().zip(times) {
                let time = time.as_u64().ok_or("time")?;
                clock.advance(Duration::from_millis(time - now));
                now = time;
                let Value::String(key) = key else { return Err("key".to_string()) };
                out.push(limiter.check_key(key).is_ok());
            }
            Ok(out)
        },
        |decisions| decisions.len() as u32,
        |decisions| -> Value { json!(decisions) },
    );
}
