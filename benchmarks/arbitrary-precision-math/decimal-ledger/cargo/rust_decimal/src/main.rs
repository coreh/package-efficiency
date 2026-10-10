use rust_decimal::{Decimal, RoundingStrategy};
use std::str::FromStr;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn strings(v: &serde_json::Value) -> Vec<String> {
    v.as_array().expect("array").iter().map(|s| s.as_str().expect("string").to_string()).collect()
}

fn cents(d: &Decimal) -> String {
    d.round_dp_with_strategy(2, RoundingStrategy::MidpointNearestEven).to_string()
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| (strings(&value["amounts"]), strings(&value["rates"]), value["block"].as_u64().expect("block") as usize),
        |(amounts, rates, block)| -> Result<Vec<String>, String> {
            let mut total = Decimal::ZERO;
            let mut subtotals = Vec::new();
            for (a, r) in amounts.chunks(*block).zip(rates.chunks(*block)) {
                let mut s = Decimal::ZERO;
                for (x, y) in a.iter().zip(r) {
                    s += Decimal::from_str(x).map_err(|e| e.to_string())? * Decimal::from_str(y).map_err(|e| e.to_string())?;
                }
                subtotals.push(cents(&s));
                total += s;
            }
            let mut out = vec![cents(&total)];
            out.extend(subtotals);
            Ok(out)
        },
        |r| r[0].len() as u32,
        |_, r| serde_json::json!(r),
    );
}
