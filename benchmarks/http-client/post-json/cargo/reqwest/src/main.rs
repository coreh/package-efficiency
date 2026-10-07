use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Client {
    http: reqwest::Client,
    origin: String,
}

async fn post(client: &'static Client, input: &'static Value) -> Result<Value, reqwest::Error> {
    let path = input["path"].as_str().expect("path");
    let body = input["body"].as_str().expect("body");
    client.http.post(format!("{}{path}", client.origin)).header("content-type", "application/json").body(body).send().await?.error_for_status()?.json().await
}

fn main() {
    // What #[tokio::main] builds: one worker thread per core.
    let runtime = tokio::runtime::Builder::new_multi_thread().enable_all().build().unwrap();
    bench_harness::client::run_tokio(
        runtime,
        |peer| Client { http: reqwest::Client::new(), origin: format!("http://{}", peer.authority()) },
        post,
        |receipt: &Value| receipt.as_object().map_or(0, |fields| fields.len() as u32),
        Value::clone,
    );
}
