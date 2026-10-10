use std::borrow::Cow;
use textwrap::{Options, WrapAlgorithm};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn consume(lines: &Vec<Cow<'static, str>>) -> u32 { lines.len() as u32 }
fn describe(lines: &Vec<Cow<'static, str>>) -> serde_json::Value {
    serde_json::Value::Array(lines.iter().map(|l| serde_json::Value::String(l.to_string())).collect())
}

fn prepare(value: &serde_json::Value) -> (&'static str, usize) {
    (Box::leak(value["text"].as_str().expect("text").to_owned().into_boxed_str()), value["width"].as_u64().expect("width") as usize)
}
fn wrap(input: &(&'static str, usize)) -> Result<Vec<Cow<'static, str>>, String> {
    let (text, width) = *input;
    Ok(textwrap::wrap(text, Options::new(width).wrap_algorithm(WrapAlgorithm::FirstFit)))
}

fn main() {
    bench_harness::operation::run_prepared(prepare, wrap, consume, |_, lines| describe(lines));
}
