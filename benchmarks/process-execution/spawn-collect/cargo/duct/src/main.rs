use duct::cmd;
use serde_json::json;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Collected { stdout: String, status: i32 }

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<Collected, String> {
            let args = input["args"].as_array().ok_or("args")?.iter().map(|a| a.as_str().unwrap_or_default());
            let output = cmd(input["command"].as_str().ok_or("command")?, args).stdout_capture().run().map_err(|e| e.to_string())?;
            Ok(Collected { stdout: String::from_utf8(output.stdout).map_err(|e| e.to_string())?, status: output.status.code().unwrap_or(-1) })
        },
        |c: &Collected| c.stdout.len() as u32,
        |c| json!({"stdout": c.stdout, "status": c.status}),
    );
}
