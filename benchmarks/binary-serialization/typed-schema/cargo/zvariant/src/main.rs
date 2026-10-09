use serde::{Deserialize, Serialize};
use zvariant::serialized::Context;
use zvariant::{LE, Type};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Serialize, Deserialize, Type, Clone, Default)]
struct Location { lat: f64, lon: f64, city: String }
#[derive(Serialize, Deserialize, Type, Clone, Default)]
struct Event { at: i32, kind: String, value: f64 }
#[derive(Serialize, Deserialize, Type, Clone, Default)]
struct Telemetry { id: i32, name: String, active: bool, score: f64, tags: Vec<String>, samples: Vec<i32>, readings: Vec<f64>, location: Location, events: Vec<Event> }
fn main() {
    let ctxt = Context::new_dbus(LE, 0);
    bench_harness::operation::run_prepared(
        // Not timed: the fixture's JSON is read into the typed record once.
        |value| <Telemetry as Deserialize>::deserialize(value).expect("fixture matches the schema"),
        move |record: &Telemetry| {
            let data = zvariant::to_bytes(ctxt, record)?;
            let (decoded, _) = data.deserialize::<Telemetry>()?;
            Ok::<Telemetry, Box<dyn std::error::Error>>(decoded)
        },
        |decoded| decoded.samples.len() as u32,
        // Not timed: byte length from one more encode of the decoded record.
        move |_, decoded| {
            let len = zvariant::to_bytes(ctxt, decoded).expect("encodes").len();
            serde_json::json!({ "decoded": serde_json::to_value(decoded).expect("json"), "encodedBytes": len })
        },
    );
}
