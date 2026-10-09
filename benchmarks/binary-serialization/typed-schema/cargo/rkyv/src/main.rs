use rkyv::rancor::Error;
use serde::{Deserialize, Serialize};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Serialize, Deserialize, Clone, Default, rkyv::Archive, rkyv::Serialize, rkyv::Deserialize)]
struct Location { lat: f64, lon: f64, city: String }
#[derive(Serialize, Deserialize, Clone, Default, rkyv::Archive, rkyv::Serialize, rkyv::Deserialize)]
struct Event { at: i32, kind: String, value: f64 }
#[derive(Serialize, Deserialize, Clone, Default, rkyv::Archive, rkyv::Serialize, rkyv::Deserialize)]
struct Telemetry { id: i32, name: String, active: bool, score: f64, tags: Vec<String>, samples: Vec<i32>, readings: Vec<f64>, location: Location, events: Vec<Event> }
fn main() {
    bench_harness::operation::run_prepared(
        // Not timed: the fixture's JSON is read into the typed record once.
        |value| <Telemetry as Deserialize>::deserialize(value).expect("fixture matches the schema"),
        |record: &Telemetry| {
            let bytes = rkyv::to_bytes::<Error>(record)?;
            rkyv::from_bytes::<Telemetry, Error>(&bytes)
        },
        |decoded| decoded.samples.len() as u32,
        // Not timed: byte length from one more encode of the decoded record.
        |_, decoded| {
            let len = rkyv::to_bytes::<Error>(decoded).expect("encodes").len();
            serde_json::json!({ "decoded": serde_json::to_value(decoded).expect("json"), "encodedBytes": len })
        },
    );
}
