use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::client::run_blocking(
        |peer| redis::Client::open(format!("redis://{}/", peer.authority())).expect("url").get_connection().expect("connect"),
        |connection: &mut redis::Connection, input: &Value| {
            let key = input["key"].as_str().expect("key");
            match input["command"].as_str() {
                Some("SET") => redis::cmd("SET").arg(key).arg(input["value"].as_str().expect("value")).query::<String>(connection),
                _ => redis::cmd("GET").arg(key).query::<String>(connection),
            }
        },
        |reply: &String| reply.len() as u32,
        |reply: &String| Value::String(reply.clone()),
    );
}
