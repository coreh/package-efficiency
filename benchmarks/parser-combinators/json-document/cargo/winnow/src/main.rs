use serde_json::{Map, Value};
use winnow::ascii::{digit1, multispace0};
use winnow::combinator::{alt, delimited, opt, preceded, repeat, separated, separated_pair};
use winnow::prelude::*;
use winnow::token::{any, one_of, take_while};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Input<'i> = &'i str;

fn num<'i>(i: &mut Input<'i>) -> ModalResult<Value> {
    (opt('-'), digit1, opt(preceded('.', digit1)), opt((one_of(['e', 'E']), opt(one_of(['+', '-'])), digit1)))
        .take()
        .map(number)
        .parse_next(i)
}

fn raw_string<'i>(i: &mut Input<'i>) -> ModalResult<&'i str> {
    delimited(
        '"',
        repeat::<_, _, (), _, _>(
            0..,
            alt((
                take_while(1.., |c: char| c != '"' && c != '\\').void(),
                preceded('\\', any).void(),
            )),
        )
        .take(),
        '"',
    )
    .parse_next(i)
}

fn string<'i>(i: &mut Input<'i>) -> ModalResult<String> {
    raw_string.map(unescape).parse_next(i)
}

fn array<'i>(i: &mut Input<'i>) -> ModalResult<Value> {
    delimited(
        ('[', multispace0),
        separated(0.., json, (multispace0, ',', multispace0)),
        (multispace0, ']'),
    )
    .map(Value::Array)
    .parse_next(i)
}

fn object<'i>(i: &mut Input<'i>) -> ModalResult<Value> {
    delimited(
        ('{', multispace0),
        separated(
            0..,
            separated_pair(string, (multispace0, ':', multispace0), json),
            (multispace0, ',', multispace0),
        ),
        (multispace0, '}'),
    )
    .map(|pairs: Vec<(String, Value)>| Value::Object(pairs.into_iter().collect::<Map<String, Value>>()))
    .parse_next(i)
}

fn json<'i>(i: &mut Input<'i>) -> ModalResult<Value> {
    alt((
        object,
        array,
        string.map(Value::String),
        num,
        "true".value(Value::Bool(true)),
        "false".value(Value::Bool(false)),
        "null".value(Value::Null),
    ))
    .parse_next(i)
}

fn parse(input: &str) -> Result<Value, String> {
    delimited(multispace0, json, multispace0).parse(input).map_err(|e| e.to_string())
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
