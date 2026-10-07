use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            ureq_proto::parser::try_parse_request::<100>(value.as_str().expect("string fixture").as_bytes())
                .map(|parsed| parsed.expect("complete request head").1)
        },
        |req| req.headers().len() as u32,
        |req| {
            let minor = if req.version() == ureq_proto::http::Version::HTTP_10 { 0 } else { 1 };
            json!({
                "method": req.method().as_str(),
                "path": req.uri().path_and_query().map_or("", |p| p.as_str()),
                "minor": minor,
                "headers": req.headers().iter().map(|(n, v)| json!([n.as_str(), v.to_str().unwrap()])).collect::<Vec<Value>>(),
            })
        },
    );
}
