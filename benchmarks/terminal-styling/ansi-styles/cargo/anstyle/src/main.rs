use anstyle::{AnsiColor, Effects, Style};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const RED: Style = Style::new().fg_color(Some(anstyle::Color::Ansi(AnsiColor::Red)));
const GREEN: Style = Style::new().fg_color(Some(anstyle::Color::Ansi(AnsiColor::Green)));
const BLUE: Style = Style::new().fg_color(Some(anstyle::Color::Ansi(AnsiColor::Blue)));
const BOLD: Style = Style::new().effects(Effects::BOLD);
const UNDERLINE: Style = Style::new().effects(Effects::UNDERLINE);

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let s = |k: &str| value[k].as_str().expect("string fixture");
        let (style, a, b, c) = (s("style"), s("a"), s("b"), s("c"));
        let one = |st: Style, t: &str| format!("{st}{t}{st:#}");
        Ok(match style {
            "red" => one(RED, a),
            "green" => one(GREEN, a),
            "bold" => one(BOLD, a),
            "underline" => one(UNDERLINE, a),
            "bold-blue" => one(BLUE.bold(), a),
            "red-bold-underline" => one(RED.bold().underline(), a),
            "bold-in-red" => format!("{}{}{}", one(RED, a), one(RED.bold(), b), one(RED, c)),
            "underline-in-green" => format!("{}{}{}", one(GREEN, a), one(GREEN.underline(), b), one(GREEN, c)),
            "red-in-bold" => format!("{}{}{}", one(BOLD, a), one(BOLD.fg_color(RED.get_fg_color()), b), one(BOLD, c)),
            "deep" => format!("{}{}{}", one(UNDERLINE, a), one(UNDERLINE.bold().fg_color(RED.get_fg_color()), b), one(UNDERLINE, c)),
            other => panic!("unknown style {other}"),
        })
    });
}
