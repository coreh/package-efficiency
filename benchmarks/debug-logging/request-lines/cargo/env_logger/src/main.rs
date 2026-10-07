use env_logger::{Builder, Target};
use log::{Level, Log, Record};
use serde_json::Value;
use std::io::Write;
use std::sync::{Arc, Mutex};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Sink(Arc<Mutex<Vec<u8>>>);
impl Write for Sink {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(buf);
        Ok(buf.len())
    }
    fn flush(&mut self) -> std::io::Result<()> { Ok(()) }
}

fn main() {
    let captured = Arc::new(Mutex::new(Vec::new()));
    let logger = Builder::new()
        .parse_filters("app:web:,app:db:,app:cache:,app:auth:,app:api:")
        .target(Target::Pipe(Box::new(Sink(captured.clone()))))
        .build();
    bench_harness::operation::run_value(
        |input| -> Result<Vec<u8>, String> {
            let ns = input["ns"].as_str().ok_or("ns")?;
            let (method, path, ms) = (input["method"].as_str().ok_or("method")?, input["path"].as_str().ok_or("path")?, input["ms"].as_i64().ok_or("ms")?);
            logger.log(&Record::builder().level(Level::Info).target(ns).args(format_args!("{method} {path} took {ms}ms")).build());
            Ok(std::mem::take(&mut *captured.lock().unwrap()))
        },
        |line| line.len() as u32,
        |line| Value::String(String::from_utf8_lossy(line).into_owned()),
    );
}
