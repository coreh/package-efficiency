use serde_json::Value;
use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    // The bundled syntaxes and themes are loaded once, as the crate's examples do.
    let syntaxes = SyntaxSet::load_defaults_newlines();
    let themes = ThemeSet::load_defaults();
    let theme = &themes.themes["base16-ocean.dark"];
    bench_harness::operation::run_value(
        |input| {
            let name = if input["language"] == "python" { "Python" } else { "JavaScript" };
            let syntax = syntaxes.find_syntax_by_name(name).ok_or("syntax not found")?;
            highlighted_html_for_string(input["code"].as_str().ok_or("code string")?, &syntaxes, syntax, theme).map_err(|e| e.to_string())
        },
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
