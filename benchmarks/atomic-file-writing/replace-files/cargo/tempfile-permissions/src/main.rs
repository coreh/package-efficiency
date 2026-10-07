use serde_json::Value;
use std::io::Write;
use std::path::PathBuf;
use std::fs::Permissions;
use std::os::unix::fs::PermissionsExt;
use tempfile::Builder;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |input| input["files"].as_array().expect("files").iter().map(|file| (PathBuf::from(file["path"].as_str().expect("path")), file["content"].as_str().expect("content").to_owned(), file["mode"].as_u64().expect("mode") as u32)).collect::<Vec<(PathBuf, String, u32)>>(),
        |files| -> std::io::Result<()> {
            for (path, content, mode) in files {
                let mut temp = Builder::new().permissions(Permissions::from_mode(*mode)).tempfile_in(path.parent().expect("parent"))?;
                temp.write_all(content.as_bytes())?;
                temp.persist(path).map_err(|e| e.error)?;
            }
            Ok(())
        },
        |_| 1,
        |_, _| Value::Null,
    );
}
