use pest::Parser;
use pest::iterators::Pair;
use pest_derive::Parser;
use serde_json::{Map, Value};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Parser)]
#[grammar_inline = r#"
WHITESPACE = _{ " " | "\t" | "\r" | "\n" }
json = _{ SOI ~ value ~ EOI }
value = _{ object | array | string | number | boolean | null }
object = { "{" ~ (pair ~ ("," ~ pair)*)? ~ "}" }
pair = { string ~ ":" ~ value }
array = { "[" ~ (value ~ ("," ~ value)*)? ~ "]" }
string = ${ "\"" ~ inner ~ "\"" }
inner = @{ ch* }
ch = { !("\"" | "\\") ~ ANY | "\\" ~ ANY }
number = @{ "-"? ~ ASCII_DIGIT+ ~ ("." ~ ASCII_DIGIT+)? ~ (("e" | "E") ~ ("+" | "-")? ~ ASCII_DIGIT+)? }
boolean = { "true" | "false" }
null = { "null" }
"#]
struct JsonParser;

fn text(pair: Pair<Rule>) -> String {
    unescape(pair.into_inner().next().expect("inner").as_str())
}

fn build(pair: Pair<Rule>) -> Value {
    match pair.as_rule() {
        Rule::object => Value::Object(
            pair.into_inner()
                .map(|p| {
                    let mut it = p.into_inner();
                    let key = text(it.next().expect("key"));
                    (key, build(it.next().expect("value")))
                })
                .collect::<Map<String, Value>>(),
        ),
        Rule::array => Value::Array(pair.into_inner().map(build).collect()),
        Rule::string => Value::String(text(pair)),
        Rule::number => number(pair.as_str()),
        Rule::boolean => Value::Bool(pair.as_str() == "true"),
        Rule::null => Value::Null,
        rule => unreachable!("{rule:?}"),
    }
}

fn parse(input: &str) -> Result<Value, String> {
    let mut pairs = JsonParser::parse(Rule::json, input).map_err(|e| e.to_string())?;
    Ok(build(pairs.next().expect("value")))
}

fn hex4(it: &mut std::str::Chars) -> u32 {
    (0..4).fold(0, |n, _| n * 16 + it.next().and_then(|c| c.to_digit(16)).expect("hex digit"))
}

/// Decodes the escapes of a string body the grammar has already validated.
fn unescape(raw: &str) -> String {
    if !raw.contains('\\') {
        return raw.to_owned();
    }
    let mut out = String::with_capacity(raw.len());
    let mut it = raw.chars();
    while let Some(c) = it.next() {
        if c != '\\' {
            out.push(c);
            continue;
        }
        out.push(match it.next().expect("escape") {
            'n' => '\n',
            't' => '\t',
            'r' => '\r',
            'b' => '\u{8}',
            'f' => '\u{c}',
            'u' => {
                let hi = hex4(&mut it);
                if (0xD800..0xDC00).contains(&hi) {
                    it.next();
                    it.next();
                    let lo = hex4(&mut it);
                    char::from_u32(0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00)).expect("scalar")
                } else {
                    char::from_u32(hi).expect("scalar")
                }
            }
            other => other,
        });
    }
    out
}

fn number(text: &str) -> Value {
    match text.parse::<i64>() {
        Ok(i) => Value::from(i),
        Err(_) => Value::from(text.parse::<f64>().expect("number")),
    }
}

fn consume(value: &Value) -> u32 {
    match value {
        Value::Array(a) => a.len() as u32,
        Value::Object(o) => o.len() as u32,
        _ => 1,
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| parse(value.as_str().expect("string fixture")),
        consume,
        Value::clone,
    );
}
