use combine::error::ParseError;
use combine::parser::char::{char, spaces};
use combine::parser::range::{recognize, take_while1};
use combine::stream::RangeStream;
use combine::{Parser, chainl1, choice, between, optional, parser};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

parser! {
    fn expr['a, Input]()(Input) -> f64
    where [Input: RangeStream<Token = char, Range = &'a str>, Input::Error: ParseError<char, &'a str, Input::Position>]
    {
        let add = choice((char('+').map(|_| (|a: f64, b: f64| a + b) as fn(f64, f64) -> f64), char('-').map(|_| (|a: f64, b: f64| a - b) as fn(f64, f64) -> f64)));
        chainl1(term(), add)
    }
}

parser! {
    fn term['a, Input]()(Input) -> f64
    where [Input: RangeStream<Token = char, Range = &'a str>, Input::Error: ParseError<char, &'a str, Input::Position>]
    {
        let mul = choice((char('*').map(|_| (|a: f64, b: f64| a * b) as fn(f64, f64) -> f64), char('/').map(|_| (|a: f64, b: f64| a / b) as fn(f64, f64) -> f64)));
        chainl1(factor(), mul)
    }
}

parser! {
    fn factor['a, Input]()(Input) -> f64
    where [Input: RangeStream<Token = char, Range = &'a str>, Input::Error: ParseError<char, &'a str, Input::Position>]
    {
        let digits = || take_while1(|c: char| c.is_ascii_digit());
        let num = recognize((digits(), optional((char('.'), digits())))).map(|s: &str| s.parse::<f64>().expect("number"));
        spaces().with(choice((
            num,
            char('-').with(factor()).map(|v: f64| -v),
            between(char('('), char(')'), expr()),
        ))).skip(spaces())
    }
}

fn parse(input: &str) -> Result<f64, String> {
    expr().skip(combine::eof()).parse(input).map(|(v, _)| v).map_err(|e| e.to_string())
}

fn main() {
    bench_harness::operation::run_value(
        |value| parse(value.as_str().expect("string fixture")),
        |v| (*v != 0.0) as u32,
        |v| Value::from(*v),
    );
}
