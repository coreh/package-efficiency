use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let schema = json!({
        "type": "object",
        "required": ["id", "name", "email", "role", "active", "tags", "scores", "address"],
        "properties": {
            "id": { "type": "integer", "minimum": 1 },
            "name": { "type": "string", "minLength": 1 },
            "email": { "type": "string" },
            "role": { "enum": ["admin", "editor", "viewer"] },
            "active": { "type": "boolean" },
            "tags": { "type": "array", "items": { "type": "string" } },
            "scores": { "type": "array", "items": { "type": "number" } },
            "nickname": { "type": "string" },
            "address": {
                "type": "object",
                "required": ["city", "zip"],
                "properties": {
                    "city": { "type": "string", "minLength": 1 },
                    "zip": { "type": "string" },
                    "geo": {
                        "type": "object",
                        "required": ["lat", "lng"],
                        "properties": {
                            "lat": { "type": "number", "minimum": -90, "maximum": 90 },
                            "lng": { "type": "number", "minimum": -180, "maximum": 180 }
                        }
                    }
                }
            }
        }
    });
    let validator = jsonschema::validator_for(&schema).expect("valid schema");
    bench_harness::operation::run_value(
        |doc| {
            Ok::<String, std::convert::Infallible>(match validator.validate(doc) {
                Ok(()) => String::new(),
                Err(e) => {
                    let mut path = e.instance_path().to_string();
                    if let jsonschema::error::ValidationErrorKind::Required { property } = e.kind() {
                        path.push('/');
                        path.push_str(property.as_str().unwrap_or(""));
                    }
                    path
                }
            })
        },
        |path| path.len() as u32,
        |path| serde_json::Value::String(path.clone()),
    );
}
