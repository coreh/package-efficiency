use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Lane {
    agent: ureq::Agent,
    origin: String,
}

fn main() {
    bench_harness::client::run_blocking(
        |peer| Lane { agent: ureq::Agent::new_with_defaults(), origin: format!("http://{}", peer.authority()) },
        |lane: &mut Lane, input: &Value| {
            let path = input["path"].as_str().expect("path");
            let body = input["body"].as_str().expect("body");
            lane.agent.post(format!("{}{path}", lane.origin)).content_type("application/json").send(body)?.body_mut().read_json::<Value>()
        },
        |receipt: &Value| receipt.as_object().map_or(0, |fields| fields.len() as u32),
        Value::clone,
    );
}
