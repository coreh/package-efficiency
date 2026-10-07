use http_body_util::{BodyExt, Empty};
use hyper::body::Bytes;
use hyper_util::client::legacy::{Client as Pool, connect::HttpConnector};
use hyper_util::rt::TokioExecutor;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Client {
    pool: Pool<HttpConnector, Empty<Bytes>>,
    origin: String,
}

type Failure = Box<dyn std::error::Error + Send + Sync>;

async fn get(client: &'static Client, input: &'static Value) -> Result<Value, Failure> {
    let path = input["path"].as_str().expect("path");
    let response = client.pool.get(format!("{}{path}", client.origin).parse()?).await?;
    if response.status() != hyper::StatusCode::OK {
        return Err(format!("status {}", response.status()).into());
    }
    let body = response.into_body().collect().await?.to_bytes();
    Ok(serde_json::from_slice(&body)?)
}

fn main() {
    // What #[tokio::main] builds: one worker thread per core.
    let runtime = tokio::runtime::Builder::new_multi_thread().enable_all().build().unwrap();
    bench_harness::client::run_tokio(
        runtime,
        |peer| Client { pool: Pool::builder(TokioExecutor::new()).build_http(), origin: format!("http://{}", peer.authority()) },
        get,
        |document: &Value| document.as_object().map_or(0, |fields| fields.len() as u32),
        Value::clone,
    );
}
