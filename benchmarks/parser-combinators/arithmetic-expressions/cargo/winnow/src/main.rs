use serde_json::Value;
use winnow::ascii::{digit1, multispace0};
use winnow::combinator::{alt, delimited, opt, preceded, repeat};
use winnow::prelude::*;
use winnow::token::one_of;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Input<'i> = &'i str;

fn num(i: &mut Input<'_>) -> ModalResult<f64> {
    (digit1, opt(preceded('.', digit1))).take().map(|s: &str| s.parse::<f64>().expect("number")).parse_next(i)
}

fn factor(i: &mut Input<'_>) -> ModalResult<f64> {
    delimited(
        multispace0,
        alt((
            num,
            preceded('-', factor).map(|v| -v),
            delimited('(', expr, (multispace0, ')')),
        )),
        multispace0,
    )
    .parse_next(i)
}

fn term(i: &mut Input<'_>) -> ModalResult<f64> {
    let init = factor.parse_next(i)?;
    repeat(0.., (one_of(['*', '/']), factor))
        .fold(move || init, |acc, (op, v)| if op == '*' { acc * v } else { acc / v })
        .parse_next(i)
}

fn expr(i: &mut Input<'_>) -> ModalResult<f64> {
    let init = term.parse_next(i)?;
    repeat(0.., (one_of(['+', '-']), term))
        .fold(move || init, |acc, (op, v)| if op == '+' { acc + v } else { acc - v })
        .parse_next(i)
}

fn parse(input: &str) -> Result<f64, String> {
    expr.parse(input).map_err(|e| e.to_string())
}

fn main() {
    bench_harness::operation::run_value(
        |value| parse(value.as_str().expect("string fixture")),
        |v| (*v != 0.0) as u32,
        |v| Value::from(*v),
    );
}
