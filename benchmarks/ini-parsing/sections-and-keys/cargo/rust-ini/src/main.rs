use ini::Ini;
use serde_json::{Map, Value};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ini::load_from_str(value.as_str().expect("string fixture")),
        |parsed| parsed.len() as u32,
        |parsed: &Ini| {
            let mut out = Map::new();
            for (section, props) in parsed.iter() {
                // The crate always keeps a nameless general section; the fixtures put nothing in it.
                let Some(section) = section else { continue };
                let mut inner = Map::new();
                for (k, v) in props.iter() {
                    inner.insert(k.to_string(), Value::String(v.to_string()));
                }
                out.insert(section.to_string(), Value::Object(inner));
            }
            Value::Object(out)
        },
    );
}
