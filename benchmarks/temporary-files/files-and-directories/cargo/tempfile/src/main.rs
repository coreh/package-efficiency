use serde_json::Value;
use std::io::Write;
use std::path::PathBuf;
use tempfile::Builder;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Job { root: PathBuf, files: usize, dirs: usize, file_prefix: String, file_suffix: String, dir_prefix: String, payload: Vec<u8> }

fn main() {
    bench_harness::operation::run_prepared(
        |input| Job {
            root: PathBuf::from(input["root"].as_str().expect("root")),
            files: input["files"].as_u64().expect("files") as usize,
            dirs: input["dirs"].as_u64().expect("dirs") as usize,
            file_prefix: input["filePrefix"].as_str().expect("filePrefix").to_owned(),
            file_suffix: input["fileSuffix"].as_str().expect("fileSuffix").to_owned(),
            dir_prefix: input["dirPrefix"].as_str().expect("dirPrefix").to_owned(),
            payload: (0..1024usize).map(|i| ((i * 7 + 3) & 255) as u8).collect(),
        },
        |job| -> std::io::Result<Vec<String>> {
            let mut files = Vec::with_capacity(job.files);
            for _ in 0..job.files {
                let mut file = Builder::new().prefix(&job.file_prefix).suffix(&job.file_suffix).tempfile_in(&job.root)?;
                file.write_all(&job.payload)?;
                files.push(file);
            }
            let mut dirs = Vec::with_capacity(job.dirs);
            for _ in 0..job.dirs {
                dirs.push(Builder::new().prefix(&job.dir_prefix).tempdir_in(&job.root)?);
            }
            let mut names: Vec<String> = files.iter().map(|f| f.path().to_str().expect("UTF-8 path").to_owned()).collect();
            names.extend(dirs.iter().map(|d| d.path().to_str().expect("UTF-8 path").to_owned()));
            for file in files { file.close()?; }
            for dir in dirs { dir.close()?; }
            Ok(names)
        },
        |names| names.len() as u32,
        |_, names| Value::from(names.clone()),
    );
}
