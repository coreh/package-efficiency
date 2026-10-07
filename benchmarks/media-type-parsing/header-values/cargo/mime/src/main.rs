use mime::Mime;
use serde_json::json;
use std::collections::HashMap;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The common shape, built inside the measured call as the other entries do.
struct Parsed { essence: String, parameters: HashMap<String, String> }

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mime = value.as_str().expect("string fixture").parse::<Mime>()?;
            Ok::<_, mime::FromStrError>(Parsed {
                essence: mime.essence_str().to_owned(),
                parameters: mime.params().map(|(name, value)| (name.as_str().to_owned(), value.as_str().to_owned())).collect(),
            })
        },
        |parsed| (parsed.essence.len() + parsed.parameters.len()) as u32,
        |parsed| json!({ "type": parsed.essence, "parameters": parsed.parameters }),
    );
}
