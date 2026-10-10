use serde_json::Value;
use std::fs::File;
use std::path::PathBuf;
use tar::{Archive, Builder};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_prepared(
        |input| {
            let path = |key: &str| PathBuf::from(input[key].as_str().expect("path"));
            (path("source"), path("archive"), path("target"))
        },
        |(source, archive, target)| -> Result<(), Error> {
            let mut builder = Builder::new(File::create(archive)?);
            builder.append_dir_all(".", source)?;
            builder.into_inner()?;
            Archive::new(File::open(archive)?).unpack(target)?;
            Ok(())
        },
        |_| 1,
        |_, _| Value::Null,
    );
}
