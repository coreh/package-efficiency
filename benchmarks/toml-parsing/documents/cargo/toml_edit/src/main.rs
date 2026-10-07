use toml_edit::{DocumentMut, Item, Value};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn value_json(value: &Value) -> serde_json::Value {
    match value {
        Value::String(s) => s.value().as_str().into(),
        Value::Integer(i) => (*i.value()).into(),
        Value::Float(f) => (*f.value()).into(),
        Value::Boolean(b) => (*b.value()).into(),
        Value::Datetime(d) => d.value().to_string().into(),
        Value::Array(a) => serde_json::Value::Array(a.iter().map(value_json).collect()),
        Value::InlineTable(t) => serde_json::Value::Object(t.iter().map(|(k, v)| (k.to_string(), value_json(v))).collect()),
    }
}

fn item_json(item: &Item) -> serde_json::Value {
    match item {
        Item::None => serde_json::Value::Null,
        Item::Value(v) => value_json(v),
        Item::Table(t) => serde_json::Value::Object(t.iter().map(|(k, v)| (k.to_string(), item_json(v))).collect()),
        Item::ArrayOfTables(a) => serde_json::Value::Array(
            a.iter().map(|t| serde_json::Value::Object(t.iter().map(|(k, v)| (k.to_string(), item_json(v))).collect())).collect(),
        ),
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| value.as_str().expect("string fixture").parse::<DocumentMut>(),
        |doc| doc.len() as u32,
        |doc| item_json(doc.as_item()),
    );
}
