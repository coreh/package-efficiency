use nu_ansi_term::{AnsiStrings, Color, Style};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let s = |k: &str| value[k].as_str().expect("string fixture");
        let (style, a, b, c) = (s("style"), s("a"), s("b"), s("c"));
        Ok(match style {
            "red" => Color::Red.paint(a).to_string(),
            "green" => Color::Green.paint(a).to_string(),
            "bold" => Style::new().bold().paint(a).to_string(),
            "underline" => Style::new().underline().paint(a).to_string(),
            "bold-blue" => Color::Blue.bold().paint(a).to_string(),
            "red-bold-underline" => Color::Red.bold().underline().paint(a).to_string(),
            "bold-in-red" => AnsiStrings(&[Color::Red.paint(a), Color::Red.bold().paint(b), Color::Red.paint(c)]).to_string(),
            "underline-in-green" => AnsiStrings(&[Color::Green.paint(a), Color::Green.underline().paint(b), Color::Green.paint(c)]).to_string(),
            "red-in-bold" => AnsiStrings(&[Style::new().bold().paint(a), Color::Red.bold().paint(b), Style::new().bold().paint(c)]).to_string(),
            "deep" => AnsiStrings(&[Style::new().underline().paint(a), Color::Red.bold().underline().paint(b), Style::new().underline().paint(c)]).to_string(),
            other => panic!("unknown style {other}"),
        })
    });
}
