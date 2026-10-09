use std::io::Write;
use termcolor::{Buffer, Color, ColorSpec, WriteColor};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn spec(fg: Option<Color>, bold: bool, underline: bool) -> ColorSpec {
    let mut s = ColorSpec::new();
    s.set_fg(fg).set_bold(bold).set_underline(underline);
    s
}

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let s = |k: &str| value[k].as_str().expect("string fixture");
        let (style, a, b, c) = (s("style"), s("a"), s("b"), s("c"));
        let mut buf = Buffer::ansi();
        let mut part = |buf: &mut Buffer, sp: ColorSpec, t: &str| {
            buf.set_color(&sp).unwrap();
            buf.write_all(t.as_bytes()).unwrap();
        };
        match style {
            "red" => part(&mut buf, spec(Some(Color::Red), false, false), a),
            "green" => part(&mut buf, spec(Some(Color::Green), false, false), a),
            "bold" => part(&mut buf, spec(None, true, false), a),
            "underline" => part(&mut buf, spec(None, false, true), a),
            "bold-blue" => part(&mut buf, spec(Some(Color::Blue), true, false), a),
            "red-bold-underline" => part(&mut buf, spec(Some(Color::Red), true, true), a),
            "bold-in-red" => {
                part(&mut buf, spec(Some(Color::Red), false, false), a);
                part(&mut buf, spec(Some(Color::Red), true, false), b);
                part(&mut buf, spec(Some(Color::Red), false, false), c);
            }
            "underline-in-green" => {
                part(&mut buf, spec(Some(Color::Green), false, false), a);
                part(&mut buf, spec(Some(Color::Green), false, true), b);
                part(&mut buf, spec(Some(Color::Green), false, false), c);
            }
            "red-in-bold" => {
                part(&mut buf, spec(None, true, false), a);
                part(&mut buf, spec(Some(Color::Red), true, false), b);
                part(&mut buf, spec(None, true, false), c);
            }
            "deep" => {
                part(&mut buf, spec(None, false, true), a);
                part(&mut buf, spec(Some(Color::Red), true, true), b);
                part(&mut buf, spec(None, false, true), c);
            }
            other => panic!("unknown style {other}"),
        }
        buf.reset().unwrap();
        Ok(String::from_utf8(buf.into_inner()).expect("utf-8 output"))
    });
}
