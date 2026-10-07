use serde_json::{Map, Value, json};
use yaml_rust::{Yaml, YamlLoader};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// For the verifier only: runs once per fixture, before measured work.
fn describe(value: &Yaml) -> Value {
    match value {
        Yaml::String(s) => json!(s),
        Yaml::Integer(n) => json!(n),
        Yaml::Real(n) => json!(n.parse::<f64>().expect("number")),
        Yaml::Boolean(b) => json!(b),
        Yaml::Array(items) => Value::Array(items.iter().map(describe).collect()),
        Yaml::Hash(map) => Value::Object(map.iter().map(|(key, item)| (key.as_str().expect("string key").to_owned(), describe(item))).collect::<Map<_, _>>()),
        Yaml::Null => Value::Null,
        other => panic!("unexpected node {other:?}"),
    }
}
fn main() {
    bench_harness::operation::run_value(
        |value| YamlLoader::load_from_str(value.as_str().expect("string fixture")),
        |docs| match &docs[0] {
            Yaml::Hash(map) => map.len() as u32,
            Yaml::Array(items) => items.len() as u32,
            _ => 0,
        },
        |docs| describe(&docs[0]),
    );
}
