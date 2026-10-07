use serde_json::Value;
use std::io::Write;
use std::sync::Mutex;
use tracing::{error, info, warn};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

static SINK: Mutex<Vec<u8>> = Mutex::new(Vec::new());

struct Sink;
impl Write for Sink {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        SINK.lock().unwrap().extend_from_slice(buf);
        Ok(buf.len())
    }
    fn flush(&mut self) -> std::io::Result<()> { Ok(()) }
}

fn main() {
    let subscriber = tracing_subscriber::fmt()
        .json()
        .with_max_level(tracing::Level::INFO)
        .with_writer(|| Sink)
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("subscriber");
    bench_harness::operation::run_value(
        |doc| -> Result<Vec<u8>, String> {
            for r in doc["records"].as_array().ok_or("records")? {
                let message = r["message"].as_str().ok_or("message")?;
                let f = &r["fields"];
                let user_id = f["user_id"].as_i64().ok_or("user_id")?;
                let route = f["route"].as_str().ok_or("route")?;
                let duration_ms = f["duration_ms"].as_f64().ok_or("duration_ms")?;
                let cached = f["cached"].as_bool().ok_or("cached")?;
                let region = f["region"].as_str().ok_or("region")?;
                match r["level"].as_str().ok_or("level")? {
                    "info" => info!(user_id, route, duration_ms, cached, region, "{}", message),
                    "warn" => warn!(user_id, route, duration_ms, cached, region, "{}", message),
                    _ => error!(user_id, route, duration_ms, cached, region, "{}", message),
                }
            }
            Ok(std::mem::take(&mut *SINK.lock().unwrap()))
        },
        |out| out.len() as u32,
        |out| Value::String(String::from_utf8_lossy(out).into_owned()),
    );
}
