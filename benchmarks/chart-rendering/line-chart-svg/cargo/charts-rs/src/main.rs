use charts_rs::{LineChart, Series};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Chart {
    width: f32,
    height: f32,
    labels: Vec<String>,
    series: Vec<Vec<f32>>,
}

// Untimed, once per fixture: the x values become the category labels charts-rs takes,
// and the series become f32, its number type.
fn prepare(input: &Value) -> Chart {
    Chart {
        width: input["width"].as_f64().expect("width") as f32,
        height: input["height"].as_f64().expect("height") as f32,
        labels: input["x"].as_array().expect("x").iter().map(|n| n.to_string()).collect(),
        series: input["series"].as_array().expect("series").iter()
            .map(|s| s.as_array().expect("array").iter().map(|n| n.as_f64().expect("number") as f32).collect())
            .collect(),
    }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |c: &Chart| {
            // LineChart takes its data by value: the copies are part of the call.
            let series = c.series.iter().enumerate().map(|(k, s)| Series::new(format!("s{k}"), s.clone())).collect();
            let mut chart = LineChart::new(series, c.labels.clone());
            chart.width = c.width;
            chart.height = c.height;
            chart.svg()
        },
        |svg| svg.len() as u32,
        // Verifier only (not timed).
        |_, svg| Value::String(svg.clone()),
    );
}
