use serde_json::Value;
use std::io::Write;
use std::path::PathBuf;
use atomicwrites::{AtomicFile, OverwriteBehavior::AllowOverwrite};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |input| input["files"].as_array().expect("files").iter().map(|file| (PathBuf::from(file["path"].as_str().expect("path")), file["content"].as_str().expect("content").to_owned(), file["mode"].as_u64().expect("mode") as u32)).collect::<Vec<(PathBuf, String, u32)>>(),
        |files| -> std::io::Result<()> {
            for (path, content, _mode) in files {
                AtomicFile::new(path, AllowOverwrite).write(|f| f.write_all(content.as_bytes())).map_err(|e| std::io::Error::other(e.to_string()))?;
            }
            Ok(())
        },
        |_| 1,
        |_, _| Value::Null,
    );
}
