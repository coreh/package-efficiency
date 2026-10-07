use prometheus::{CounterVec, GaugeVec, HistogramOpts, HistogramVec, Opts, Registry, TextEncoder};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn text<'a>(value: &'a Value, key: &str) -> Result<&'a str, Error> {
    value[key].as_str().ok_or_else(|| key.into())
}

fn labels(value: &Value) -> Result<Vec<&str>, Error> {
    value["labels"].as_array().ok_or("labels")?.iter().map(|l| l.as_str().ok_or_else(|| "label".into())).collect()
}

fn render(spec: &Value) -> Result<String, Error> {
    let registry = Registry::new();
    let mut counters = Vec::new();
    for m in spec["counters"].as_array().ok_or("counters")? {
        let vec = CounterVec::new(Opts::new(text(m, "name")?, text(m, "help")?), &labels(m)?)?;
        registry.register(Box::new(vec.clone()))?;
        counters.push(vec);
    }
    let mut gauges = Vec::new();
    for m in spec["gauges"].as_array().ok_or("gauges")? {
        let vec = GaugeVec::new(Opts::new(text(m, "name")?, text(m, "help")?), &labels(m)?)?;
        registry.register(Box::new(vec.clone()))?;
        gauges.push(vec);
    }
    let mut histograms = Vec::new();
    for m in spec["histograms"].as_array().ok_or("histograms")? {
        let buckets = m["buckets"].as_array().ok_or("buckets")?.iter().filter_map(Value::as_f64).collect();
        let opts = HistogramOpts::new(text(m, "name")?, text(m, "help")?).buckets(buckets);
        let vec = HistogramVec::new(opts, &labels(m)?)?;
        registry.register(Box::new(vec.clone()))?;
        histograms.push(vec);
    }
    for update in spec["updates"].as_array().ok_or("updates")? {
        let op = update[0].as_str().ok_or("op")?;
        let index = update[1].as_u64().ok_or("index")? as usize;
        let values: Vec<&str> = update[2].as_array().ok_or("values")?.iter().filter_map(Value::as_str).collect();
        let amount = update[3].as_f64().ok_or("amount")?;
        match op {
            "inc" => counters[index].with_label_values(&values).inc_by(amount),
            "observe" => histograms[index].with_label_values(&values).observe(amount),
            "set" => gauges[index].with_label_values(&values).set(amount),
            "add" => gauges[index].with_label_values(&values).add(amount),
            _ => gauges[index].with_label_values(&values).sub(amount),
        }
    }
    Ok(TextEncoder::new().encode_to_string(&registry.gather())?)
}

fn main() {
    bench_harness::operation::run_value(
        render,
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
