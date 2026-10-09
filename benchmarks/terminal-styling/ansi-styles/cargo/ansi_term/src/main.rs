use ansi_term::{ANSIStrings, Colour, Style};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let s = |k: &str| value[k].as_str().expect("string fixture");
        let (style, a, b, c) = (s("style"), s("a"), s("b"), s("c"));
        Ok(match style {
            "red" => Colour::Red.paint(a).to_string(),
            "green" => Colour::Green.paint(a).to_string(),
            "bold" => Style::new().bold().paint(a).to_string(),
            "underline" => Style::new().underline().paint(a).to_string(),
            "bold-blue" => Colour::Blue.bold().paint(a).to_string(),
            "red-bold-underline" => Colour::Red.bold().underline().paint(a).to_string(),
            "bold-in-red" => ANSIStrings(&[Colour::Red.paint(a), Colour::Red.bold().paint(b), Colour::Red.paint(c)]).to_string(),
            "underline-in-green" => ANSIStrings(&[Colour::Green.paint(a), Colour::Green.underline().paint(b), Colour::Green.paint(c)]).to_string(),
            "red-in-bold" => ANSIStrings(&[Style::new().bold().paint(a), Colour::Red.bold().paint(b), Style::new().bold().paint(c)]).to_string(),
            "deep" => ANSIStrings(&[Style::new().underline().paint(a), Colour::Red.bold().underline().paint(b), Style::new().underline().paint(c)]).to_string(),
            other => panic!("unknown style {other}"),
        })
    });
}
