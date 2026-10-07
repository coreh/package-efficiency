use dlv_list::VecList;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let pair = value.as_array().expect("pair fixture");
            let window = pair[0].as_u64().expect("window") as usize;
            let items = pair[1].as_array().expect("items");
            let mut queue: VecList<i64> = VecList::new();
            let mut out: Vec<i64> = Vec::new();
            for item in items {
                queue.push_back(item.as_i64().expect("integer"));
                if queue.len() > window {
                    out.push(queue.pop_front().unwrap());
                }
            }
            let held = queue.len();
            while let Some(item) = queue.pop_front() {
                out.push(item);
            }
            out.push(held as i64);
            Ok::<Vec<i64>, std::convert::Infallible>(out)
        },
        |out| out.len() as u32,
        |out| Value::from(out.clone()),
    );
}
