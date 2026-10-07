use nom::branch::alt;
use nom::bytes::complete::take_while1;
use nom::character::complete::{char, multispace0, one_of};
use nom::combinator::{map, opt, recognize};
use nom::multi::fold_many0;
use nom::sequence::{delimited, preceded};
use nom::{IResult, Parser};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn digits(i: &str) -> IResult<&str, &str> {
    take_while1(|c: char| c.is_ascii_digit()).parse(i)
}

fn num(i: &str) -> IResult<&str, f64> {
    map(recognize((digits, opt(preceded(char('.'), digits)))), |s: &str| s.parse::<f64>().expect("number")).parse(i)
}

fn factor(i: &str) -> IResult<&str, f64> {
    delimited(
        multispace0,
        alt((
            num,
            map(preceded(char('-'), factor), |v| -v),
            delimited(char('('), expr, preceded(multispace0, char(')'))),
        )),
        multispace0,
    )
    .parse(i)
}

fn term(i: &str) -> IResult<&str, f64> {
    let (i, init) = factor(i)?;
    fold_many0((one_of("*/"), factor), move || init, |acc, (op, v)| if op == '*' { acc * v } else { acc / v }).parse(i)
}

fn expr(i: &str) -> IResult<&str, f64> {
    let (i, init) = term(i)?;
    fold_many0((one_of("+-"), term), move || init, |acc, (op, v)| if op == '+' { acc + v } else { acc - v }).parse(i)
}

fn parse(input: &str) -> Result<f64, String> {
    match expr(input) {
        Ok(("", v)) => Ok(v),
        Ok((rest, _)) => Err(format!("trailing input: {rest:.20}")),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| parse(value.as_str().expect("string fixture")),
        |v| (*v != 0.0) as u32,
        |v| Value::from(*v),
    );
}
