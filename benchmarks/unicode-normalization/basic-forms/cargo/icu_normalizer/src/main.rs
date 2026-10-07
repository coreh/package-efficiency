use icu_normalizer::{ComposingNormalizerBorrowed, DecomposingNormalizerBorrowed};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_borrowed_with_external_verification(|value| {
        let form = value[0].as_str().expect("form");
        let text = value[1].as_str().expect("text");
        Ok(match form {
            "NFC" => ComposingNormalizerBorrowed::new_nfc().normalize(text),
            "NFD" => DecomposingNormalizerBorrowed::new_nfd().normalize(text),
            "NFKC" => ComposingNormalizerBorrowed::new_nfkc().normalize(text),
            _ => DecomposingNormalizerBorrowed::new_nfkd().normalize(text),
        })
    });
}
