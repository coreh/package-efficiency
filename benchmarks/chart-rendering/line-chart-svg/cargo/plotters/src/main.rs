use plotters::prelude::*;
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Chart {
    width: u32,
    height: u32,
    x: Vec<f64>,
    series: Vec<Vec<f64>>,
}

// Untimed, once per fixture: the JSON becomes numbers.
fn prepare(input: &Value) -> Chart {
    let floats = |v: &Value| v.as_array().expect("array").iter().map(|n| n.as_f64().expect("number")).collect::<Vec<f64>>();
    Chart {
        width: input["width"].as_u64().expect("width") as u32,
        height: input["height"].as_u64().expect("height") as u32,
        x: floats(&input["x"]),
        series: input["series"].as_array().expect("series").iter().map(floats).collect(),
    }
}

fn render(c: &Chart) -> Result<String, Box<dyn std::error::Error>> {
    let mut out = String::new();
    {
        let root = SVGBackend::with_string(&mut out, (c.width, c.height)).into_drawing_area();
        root.fill(&WHITE)?;
        // plotters takes the axis ranges from the caller.
        let (x0, x1) = c.x.iter().fold((f64::INFINITY, f64::NEG_INFINITY), |(a, b), &v| (a.min(v), b.max(v)));
        let (y0, y1) = c.series.iter().flatten().fold((f64::INFINITY, f64::NEG_INFINITY), |(a, b), &v| (a.min(v), b.max(v)));
        let mut chart = ChartBuilder::on(&root)
            .margin(10)
            .x_label_area_size(30)
            .y_label_area_size(40)
            .build_cartesian_2d(x0..x1, y0..y1)?;
        chart.configure_mesh().draw()?;
        for (k, s) in c.series.iter().enumerate() {
            chart.draw_series(LineSeries::new(c.x.iter().copied().zip(s.iter().copied()), &Palette99::pick(k)))?;
        }
        root.present()?;
    }
    Ok(out)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |c: &Chart| render(c).map_err(|e| e.to_string()),
        |svg| svg.len() as u32,
        // Verifier only (not timed).
        |_, svg| Value::String(svg.clone()),
    );
}
