use nom::branch::alt;
use nom::bytes::complete::{tag, take_while1};
use nom::character::complete::{char, multispace0, one_of};
use nom::combinator::{map, opt, recognize, value};
use nom::multi::{many0_count, separated_list0};
use nom::sequence::{delimited, preceded, separated_pair};
use nom::{IResult, Parser};
use serde_json::{Map, Value};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn ws(i: &str) -> IResult<&str, &str> {
    multispace0(i)
}

fn digits(i: &str) -> IResult<&str, &str> {
    take_while1(|c: char| c.is_ascii_digit()).parse(i)
}

fn num(i: &str) -> IResult<&str, Value> {
    map(
        recognize((
            opt(char('-')),
            digits,
            opt(preceded(char('.'), digits)),
            opt((one_of("eE"), opt(one_of("+-")), digits)),
        )),
        number,
    )
    .parse(i)
}

fn raw_string(i: &str) -> IResult<&str, &str> {
    delimited(
        char('"'),
        recognize(many0_count(alt((
            take_while1(|c: char| c != '"' && c != '\\'),
            recognize(preceded(char('\\'), nom::character::complete::anychar)),
        )))),
        char('"'),
    )
    .parse(i)
}

fn string(i: &str) -> IResult<&str, String> {
    map(raw_string, unescape).parse(i)
}

fn array(i: &str) -> IResult<&str, Value> {
    map(
        delimited(
            (char('['), ws),
            separated_list0(delimited(ws, char(','), ws), json),
            (ws, char(']')),
        ),
        Value::Array,
    )
    .parse(i)
}

fn object(i: &str) -> IResult<&str, Value> {
    map(
        delimited(
            (char('{'), ws),
            separated_list0(
                delimited(ws, char(','), ws),
                separated_pair(string, delimited(ws, char(':'), ws), json),
            ),
            (ws, char('}')),
        ),
        |pairs| Value::Object(pairs.into_iter().collect::<Map<String, Value>>()),
    )
    .parse(i)
}

fn json(i: &str) -> IResult<&str, Value> {
    alt((
        object,
        array,
        map(string, Value::String),
        num,
        value(Value::Bool(true), tag("true")),
        value(Value::Bool(false), tag("false")),
        value(Value::Null, tag("null")),
    ))
    .parse(i)
}

fn parse(input: &str) -> Result<Value, String> {
    match delimited(ws, json, ws).parse(input) {
        Ok(("", v)) => Ok(v),
        Ok((rest, _)) => Err(format!("trailing input: {rest:.20}")),
        Err(e) => Err(e.to_string()),
    }
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
