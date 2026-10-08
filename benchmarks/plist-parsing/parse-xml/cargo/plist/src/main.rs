use base64::Engine;
use plist::Value;
use serde_json::{Value as Json, json};
use std::io::Cursor;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Dates and data become { "$date": text } and { "$data": base64 } in describe,
// which runs once per fixture before any measured work.
fn describe_value(value: &Value) -> Json {
    match value {
        Value::Array(items) => Json::Array(items.iter().map(describe_value).collect()),
        Value::Dictionary(dict) => Json::Object(dict.iter().map(|(k, v)| (k.clone(), describe_value(v))).collect()),
        Value::Boolean(b) => json!(b),
        Value::Data(bytes) => json!({ "$data": base64::engine::general_purpose::STANDARD.encode(bytes) }),
        Value::Date(date) => json!({ "$date": date.to_xml_format() }),
        Value::Real(r) => json!(r),
        Value::Integer(i) => match (i.as_signed(), i.as_unsigned()) {
            (Some(s), _) => json!(s),
            (None, Some(u)) => json!(u),
            _ => Json::Null,
        },
        Value::String(s) => json!(s),
        other => json!(format!("{other:?}")),
    }
}

fn main() {
    bench_harness::operation::run_value(
        |input| Value::from_reader(Cursor::new(input.as_str().ok_or("string fixture")?.as_bytes())).map_err(|e| e.to_string()),
        |v: &Value| v.as_dictionary().map_or(1, |d| d.len() as u32),
        describe_value,
    );
}
