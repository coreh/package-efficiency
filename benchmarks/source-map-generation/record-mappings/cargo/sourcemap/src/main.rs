use serde_json::Value;
use sourcemap::SourceMapBuilder;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input { file: String, sources: Vec<String>, names: Vec<String>, mappings: Vec<[i64; 6]> }

// Untimed, once per fixture: the JSON lists become typed ones, the footing a
// JavaScript package has when it is handed parsed arrays.
fn prepare(input: &Value) -> Input {
    let strings = |v: &Value| v.as_array().expect("list").iter().map(|s| s.as_str().expect("string").to_owned()).collect();
    Input {
        file: input["file"].as_str().expect("file").to_owned(),
        sources: strings(&input["sources"]),
        names: strings(&input["names"]),
        mappings: input["mappings"].as_array().expect("mappings").iter().map(|m| std::array::from_fn(|k| m[k].as_i64().expect("integer"))).collect(),
    }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |input| -> Result<String, String> {
            let mut builder = SourceMapBuilder::new(Some(&input.file));
            for m in &input.mappings {
                let name = if m[5] < 0 { None } else { Some(input.names[m[5] as usize].as_str()) };
                builder.add(m[0] as u32, m[1] as u32, m[3] as u32, m[4] as u32, Some(input.sources[m[2] as usize].as_str()), name, false);
            }
            // The crate encodes the mappings only when it writes the map out as JSON.
            let mut out = Vec::new();
            builder.into_sourcemap().to_writer(&mut out).map_err(|e| e.to_string())?;
            String::from_utf8(out).map_err(|e| e.to_string())
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.clone()),
    );
}
