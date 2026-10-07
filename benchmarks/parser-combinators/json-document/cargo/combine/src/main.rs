use combine::error::ParseError;
use combine::parser::char::{char, spaces, string};
use combine::parser::range::{recognize, take_while1};
use combine::stream::RangeStream;
use combine::{any, between, choice, optional, parser, sep_by, skip_many, Parser};
use serde_json::{Map, Value};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Range parsers borrow string bodies and number text from the input, as the
// nom and winnow grammars do, instead of collecting characters one by one.
fn json_string<'a, Input>() -> impl Parser<Input, Output = String>
where
    Input: RangeStream<Token = char, Range = &'a str>,
    Input::Error: ParseError<char, &'a str, Input::Position>,
{
    between(
        char('"'),
        char('"'),
        recognize(skip_many(choice((
            take_while1(|c: char| c != '"' && c != '\\').map(|_| ()),
            char('\\').with(any()).map(|_| ()),
        )))),
    )
    .map(|s: &str| unescape(s))
}

parser! {
    fn json_value['a, Input]()(Input) -> Value
    where [Input: RangeStream<Token = char, Range = &'a str>, Input::Error: ParseError<char, &'a str, Input::Position>]
    {
        let lex_char = |c| char(c).skip(spaces());
        let digits = || take_while1(|c: char| c.is_ascii_digit());
        let num = recognize((
            optional(char('-')),
            digits(),
            optional((char('.'), digits())),
            optional((choice((char('e'), char('E'))), optional(choice((char('+'), char('-')))), digits())),
        ))
        .map(|s: &str| number(s));
        let array = between(
            lex_char('['),
            lex_char(']'),
            sep_by(json_value().skip(spaces()), lex_char(',')),
        )
        .map(Value::Array);
        let member = (json_string().skip(spaces()), lex_char(':'), json_value().skip(spaces())).map(|(k, _, v)| (k, v));
        let object = between(lex_char('{'), lex_char('}'), sep_by(member, lex_char(',')))
            .map(|pairs: Vec<(String, Value)>| Value::Object(pairs.into_iter().collect::<Map<String, Value>>()));
        choice((
            object,
            array,
            json_string().map(Value::String),
            num,
            string("true").map(|_| Value::Bool(true)),
            string("false").map(|_| Value::Bool(false)),
            string("null").map(|_| Value::Null),
        ))
    }
}

fn parse(input: &str) -> Result<Value, String> {
    spaces()
        .with(json_value())
        .skip(spaces())
        .skip(combine::eof())
        .parse(input)
        .map(|(v, _)| v)
        .map_err(|e| e.to_string())
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
