use metrics::Label;
use metrics_exporter_prometheus::{Matcher, PrometheusBuilder};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn names<'a>(value: &'a Value) -> Result<Vec<&'a str>, Error> {
    value["labels"].as_array().ok_or("labels")?.iter().map(|l| l.as_str().ok_or_else(|| "label".into())).collect()
}

fn render(spec: &Value) -> Result<String, Error> {
    let mut builder = PrometheusBuilder::new();
    for m in spec["histograms"].as_array().ok_or("histograms")? {
        let buckets: Vec<f64> = m["buckets"].as_array().ok_or("buckets")?.iter().filter_map(Value::as_f64).collect();
        builder = builder.set_buckets_for_metric(Matcher::Full(m["name"].as_str().ok_or("name")?.to_string()), &buckets)?;
    }
    let recorder = builder.build_recorder();
    let handle = recorder.handle();
    let list = |key: &str| -> Result<&Vec<Value>, Error> { Ok(spec[key].as_array().ok_or("metrics")?) };
    let (counters, gauges, histograms) = (list("counters")?, list("gauges")?, list("histograms")?);
    metrics::with_local_recorder(&recorder, || -> Result<(), Error> {
        for m in counters {
            let (name, help) = (m["name"].as_str().ok_or("name")?.to_string(), m["help"].as_str().ok_or("help")?.to_string());
            metrics::describe_counter!(name, help);
        }
        for m in gauges {
            let (name, help) = (m["name"].as_str().ok_or("name")?.to_string(), m["help"].as_str().ok_or("help")?.to_string());
            metrics::describe_gauge!(name, help);
        }
        for m in histograms {
            let (name, help) = (m["name"].as_str().ok_or("name")?.to_string(), m["help"].as_str().ok_or("help")?.to_string());
            metrics::describe_histogram!(name, help);
        }
        for update in spec["updates"].as_array().ok_or("updates")? {
            let op = update[0].as_str().ok_or("op")?;
            let index = update[1].as_u64().ok_or("index")? as usize;
            let amount = update[3].as_f64().ok_or("amount")?;
            let metric = &spec[match op { "inc" => "counters", "observe" => "histograms", _ => "gauges" }][index];
            let name = metric["name"].as_str().ok_or("name")?.to_string();
            let labels: Vec<Label> = names(metric)?
                .into_iter()
                .zip(update[2].as_array().ok_or("values")?)
                .map(|(k, v)| Label::new(k.to_string(), v.as_str().unwrap_or("").to_string()))
                .collect();
            match op {
                "inc" => metrics::counter!(name, labels).increment(amount as u64),
                "observe" => metrics::histogram!(name, labels).record(amount),
                "set" => metrics::gauge!(name, labels).set(amount),
                "add" => metrics::gauge!(name, labels).increment(amount),
                _ => metrics::gauge!(name, labels).decrement(amount),
            }
        }
        Ok(())
    })?;
    Ok(handle.render())
}

fn main() {
    bench_harness::operation::run_value(
        render,
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
