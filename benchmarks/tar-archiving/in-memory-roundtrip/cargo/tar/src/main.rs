use serde_json::{Value, json};
use std::io::{Cursor, Read};
use tar::{Archive, Builder, Header};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<(usize, Vec<(String, String)>), Error> {
            let mut builder = Builder::new(Vec::new());
            for entry in input.as_array().expect("entry list") {
                let data = entry["text"].as_str().expect("text").as_bytes();
                let mut header = Header::new_gnu();
                header.set_size(data.len() as u64);
                header.set_mode(0o644);
                header.set_mtime(0);
                builder.append_data(&mut header, entry["name"].as_str().expect("name"), data)?;
            }
            let bytes = builder.into_inner()?;
            let archive_bytes = bytes.len();
            let mut archive = Archive::new(Cursor::new(bytes));
            let mut entries = Vec::new();
            for file in archive.entries()? {
                let mut file = file?;
                let name = file.path()?.to_string_lossy().into_owned();
                let mut text = String::new();
                file.read_to_string(&mut text)?;
                entries.push((name, text));
            }
            Ok((archive_bytes, entries))
        },
        |(_, entries)| entries.len() as u32,
        |(archive_bytes, entries)| json!({
            "archiveBytes": archive_bytes,
            "entries": entries.iter().map(|(name, text)| json!({"name": name, "text": text})).collect::<Vec<Value>>(),
        }),
    );
}
