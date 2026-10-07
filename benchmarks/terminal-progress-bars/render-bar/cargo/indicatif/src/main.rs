use indicatif::{ProgressBar, ProgressDrawTarget, TermLike};
use std::convert::Infallible;
use std::io;
use std::sync::{Arc, Mutex};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// An in-memory terminal 80 columns wide: only the last non-blank write is kept.
#[derive(Debug)]
struct Sink(Arc<Mutex<String>>);

impl Sink {
    fn keep(&self, s: &str) {
        if s.bytes().any(|b| b > b' ') {
            let mut last = self.0.lock().unwrap();
            last.clear();
            last.push_str(s);
        }
    }
}

impl TermLike for Sink {
    fn width(&self) -> u16 { 80 }
    fn move_cursor_up(&self, _: usize) -> io::Result<()> { Ok(()) }
    fn move_cursor_down(&self, _: usize) -> io::Result<()> { Ok(()) }
    fn move_cursor_right(&self, _: usize) -> io::Result<()> { Ok(()) }
    fn move_cursor_left(&self, _: usize) -> io::Result<()> { Ok(()) }
    fn write_line(&self, s: &str) -> io::Result<()> { self.keep(s); Ok(()) }
    fn write_str(&self, s: &str) -> io::Result<()> { self.keep(s); Ok(()) }
    fn clear_line(&self) -> io::Result<()> { Ok(()) }
    fn flush(&self) -> io::Result<()> { Ok(()) }
}

fn render(value: &serde_json::Value) -> String {
    let total = value["total"].as_u64().expect("total");
    let steps = value["steps"].as_u64().expect("steps");
    let last = Arc::new(Mutex::new(String::new()));
    let target = ProgressDrawTarget::term_like(Box::new(Sink(last.clone())));
    let bar = ProgressBar::with_draw_target(Some(total), target);
    for _ in 0..steps {
        bar.inc(1);
        bar.force_draw();
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
