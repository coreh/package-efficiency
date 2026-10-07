use pest::Parser;
use pest::iterators::Pair;
use pest_derive::Parser;
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Parser)]
#[grammar_inline = r#"
WHITESPACE = _{ " " | "\t" | "\r" | "\n" }
number = @{ ASCII_DIGIT+ ~ ("." ~ ASCII_DIGIT+)? }
add_op = { "+" | "-" }
mul_op = { "*" | "/" }
neg = { "-" ~ factor }
factor = _{ number | neg | "(" ~ expr ~ ")" }
term = { factor ~ (mul_op ~ factor)* }
expr = { term ~ (add_op ~ term)* }
program = _{ SOI ~ expr ~ EOI }
"#]
struct ArithParser;

fn eval(pair: Pair<Rule>) -> f64 {
    match pair.as_rule() {
        Rule::number => pair.as_str().parse::<f64>().expect("number"),
        Rule::neg => -eval(pair.into_inner().next().expect("factor")),
        Rule::expr | Rule::term => {
            let mut it = pair.into_inner();
            let mut acc = eval(it.next().expect("operand"));
            while let Some(op) = it.next() {
                let v = eval(it.next().expect("operand"));
                acc = match op.as_str() {
                    "+" => acc + v,
                    "-" => acc - v,
                    "*" => acc * v,
                    _ => acc / v,
                };
            }
            acc
        }
        rule => unreachable!("{rule:?}"),
    }
}

fn parse(input: &str) -> Result<f64, String> {
    let mut pairs = ArithParser::parse(Rule::program, input).map_err(|e| e.to_string())?;
    Ok(eval(pairs.next().expect("expression")))
}

fn main() {
    bench_harness::operation::run_value(
        |value| parse(value.as_str().expect("string fixture")),
        |v| (*v != 0.0) as u32,
        |v| Value::from(*v),
    );
}
