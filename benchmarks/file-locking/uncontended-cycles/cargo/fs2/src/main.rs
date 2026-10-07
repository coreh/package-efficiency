use fs2::FileExt;
use serde_json::Value;
use std::fs::OpenOptions;
use std::path::PathBuf;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn open(path: &PathBuf) -> std::fs::File {
    OpenOptions::new().read(true).write(true).create(true).open(path).expect("open")
}

fn main() {
    bench_harness::operation::run_prepared(
        |input| (PathBuf::from(input["path"].as_str().expect("path")), input["cycles"].as_u64().expect("cycles")),
        |(path, cycles)| {
            let (mut held, mut freed) = (0u32, 0u32);
            for _ in 0..*cycles {
                let a = open(path);
                a.lock_exclusive().expect("lock");
                let b = open(path);
                if b.try_lock_exclusive().is_ok() {
                    held += 1;
                    FileExt::unlock(&b).expect("unlock");
                }
                FileExt::unlock(&a).expect("unlock");
                if b.try_lock_exclusive().is_ok() {
                    freed += 1;
                    FileExt::unlock(&b).expect("unlock");
                }
            }
            Ok::<[u32; 2], std::io::Error>([held, freed])
        },
        |counts| counts.len() as u32,
        |_, counts| Value::from(counts.to_vec()),
    );
}
