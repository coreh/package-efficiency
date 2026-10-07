use colored::Colorize;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    // There is no terminal here, so colours are forced on, once.
    colored::control::set_override(true);
    bench_harness::operation::run_with_external_verification(|value| {
        let s = |k: &str| value[k].as_str().expect("string fixture");
        let (style, a, b, c) = (s("style"), s("a"), s("b"), s("c"));
        Ok(match style {
            "red" => a.red().to_string(),
            "green" => a.green().to_string(),
            "bold" => a.bold().to_string(),
            "underline" => a.underline().to_string(),
            "bold-blue" => a.blue().bold().to_string(),
            "red-bold-underline" => a.red().bold().underline().to_string(),
            "bold-in-red" => format!("{a}{}{c}", b.bold()).red().to_string(),
            "underline-in-green" => format!("{a}{}{c}", b.underline()).green().to_string(),
            "red-in-bold" => format!("{a}{}{c}", b.red()).bold().to_string(),
            "deep" => format!("{a}{}{c}", b.bold().red()).underline().to_string(),
            other => panic!("unknown style {other}"),
        })
    });
}
