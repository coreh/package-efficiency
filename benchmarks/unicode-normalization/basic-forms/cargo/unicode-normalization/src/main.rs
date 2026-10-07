use unicode_normalization::UnicodeNormalization;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let form = value[0].as_str().expect("form");
        let text = value[1].as_str().expect("text");
        Ok(match form {
            "NFC" => text.nfc().collect::<String>(),
            "NFD" => text.nfd().collect::<String>(),
            "NFKC" => text.nfkc().collect::<String>(),
            _ => text.nfkd().collect::<String>(),
        })
    });
}
