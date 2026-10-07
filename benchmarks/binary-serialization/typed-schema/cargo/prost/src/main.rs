use prost::Message;
use serde::{Deserialize, Serialize};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Serialize, Deserialize, Clone, PartialEq, prost::Message)]
struct Location {
    #[prost(double, tag = "1")]
    lat: f64,
    #[prost(double, tag = "2")]
    lon: f64,
    #[prost(string, tag = "3")]
    city: String,
}
#[derive(Serialize, Deserialize, Clone, PartialEq, prost::Message)]
struct Event {
    #[prost(int32, tag = "1")]
    at: i32,
    #[prost(string, tag = "2")]
    kind: String,
    #[prost(double, tag = "3")]
    value: f64,
}
#[derive(Serialize, Deserialize, Clone, PartialEq, prost::Message)]
struct Telemetry {
    #[prost(int32, tag = "1")]
    id: i32,
    #[prost(string, tag = "2")]
    name: String,
    #[prost(bool, tag = "3")]
    active: bool,
    #[prost(double, tag = "4")]
    score: f64,
    #[prost(string, repeated, tag = "5")]
    tags: Vec<String>,
    #[prost(int32, repeated, tag = "6")]
    samples: Vec<i32>,
    #[prost(double, repeated, tag = "7")]
    readings: Vec<f64>,
    #[prost(message, optional, tag = "8")]
    location: Option<Location>,
    #[prost(message, repeated, tag = "9")]
    events: Vec<Event>,
}

fn main() {
    bench_harness::operation::run_prepared(
        // Not timed: the fixture's JSON is read into the typed record once.
        |value| <Telemetry as Deserialize>::deserialize(value).expect("fixture matches the schema"),
        |record: &Telemetry| {
            let bytes = record.encode_to_vec();
            Telemetry::decode(bytes.as_slice()).map_err(Box::<dyn std::error::Error>::from)
        },
        |decoded| decoded.samples.len() as u32,
        // Not timed: byte length from one more encode of the decoded record.
        |_, decoded| {
            let len = decoded.encode_to_vec().len();
            serde_json::json!({ "decoded": serde_json::to_value(decoded).expect("json"), "encodedBytes": len })
        },
    );
}
