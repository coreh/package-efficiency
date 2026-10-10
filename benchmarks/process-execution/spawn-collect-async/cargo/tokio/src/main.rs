use serde_json::{Value, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Call {
    command: String,
    args: Vec<String>,
}

struct Collected {
    stdout: String,
    status: i32,
}

async fn operation(call: &'static Call) -> Result<Collected, String> {
    let output = tokio::process::Command::new(&call.command).args(&call.args).output().await.map_err(|e| e.to_string())?;
    Ok(Collected { stdout: String::from_utf8(output.stdout).map_err(|e| e.to_string())?, status: output.status.code().unwrap_or(-1) })
}

fn main() {
    let runtime = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();
    bench_harness::async_operation::run(
        |main| runtime.block_on(main),
        |input: &Value| Call {
            command: input["command"].as_str().unwrap().to_string(),
            args: input["args"].as_array().unwrap().iter().map(|a| a.as_str().unwrap().to_string()).collect(),
        },
        operation,
        |c| c.stdout.len() as u32,
        |_, c| json!({ "stdout": c.stdout, "status": c.status }),
    );
}
