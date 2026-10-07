use owo_colors::OwoColorize;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let s = |k: &str| value[k].as_str().expect("string fixture");
        let (style, a, b, c) = (s("style"), s("a"), s("b"), s("c"));
        Ok(match style {
            "red" => a.red().to_string(),
            "green" => a.green().to_string(),
            "bold" => a.bold().to_string(),
            "underline" => a.underline().to_string(),
            "bold-blue" => a.blue().bold().to_string(),
            "red-bold-underline" => a.underline().bold().red().to_string(),
            "bold-in-red" => format!("{}{}{}", a.red(), b.red().bold(), c.red()),
            "underline-in-green" => format!("{}{}{}", a.green(), b.green().underline(), c.green()),
            "red-in-bold" => format!("{}{}{}", a.bold(), b.bold().red(), c.bold()),
            "deep" => format!("{}{}{}", a.underline(), b.underline().bold().red(), c.underline()),
            other => panic!("unknown style {other}"),
        })
    });
}
