use pbr::ProgressBar;
use std::convert::Infallible;
use std::io;
use std::sync::{Arc, Mutex};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// An in-memory writer: only the last non-blank write is kept.
struct Sink(Arc<Mutex<String>>);

impl io::Write for Sink {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        if buf.iter().any(|&b| b > b' ') {
            let mut last = self.0.lock().unwrap();
            last.clear();
            last.push_str(&String::from_utf8_lossy(buf));
        }
        Ok(buf.len())
    }
    fn flush(&mut self) -> io::Result<()> { Ok(()) }
}

fn render(value: &serde_json::Value) -> String {
    let total = value["total"].as_u64().expect("total");
    let steps = value["steps"].as_u64().expect("steps");
    let last = Arc::new(Mutex::new(String::new()));
    let mut bar = ProgressBar::on(Sink(last.clone()), total);
    bar.set_max_refresh_rate(None);
    bar.set_width(Some(80));
    for _ in 0..steps {
        bar.inc();
    }
    let out = last.lock().unwrap().clone();
    out
}

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<String, Infallible>(render(value)),
        |s| s.len() as u32,
        |s| serde_json::Value::from(s.as_str()),
    );
}
