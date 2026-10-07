#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let rows = value.as_array().expect("rows fixture");
            let mut writer = csv::Writer::from_writer(Vec::new());
            for row in rows {
                writer.write_record(row.as_array().expect("row").iter().map(|f| f.as_str().expect("string field")))?;
            }
            // The writer's own output: bytes. Nothing is validated or copied here.
            writer.into_inner().map_err(|e| csv::Error::from(e.into_error()))
        },
        |bytes: &Vec<u8>| bytes.len() as u32,
        // Verifier only (not timed): the bytes as text.
        |bytes| serde_json::Value::String(String::from_utf8(bytes.clone()).expect("utf-8")),
    );
}
