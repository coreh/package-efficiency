use dlv_list::VecList;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let items = value.as_array().expect("list fixture");
            let mut dq: VecList<i64> = VecList::new();
            let mut out: Vec<i64> = Vec::new();
            for item in items {
                let x = item.as_i64().expect("integer");
                match x & 3 {
                    0 => {
                        dq.push_back(x);
                    }
                    1 => {
                        dq.push_front(x);
                    }
                    2 => {
                        if dq.len() > 0 {
                            out.push(dq.pop_front().unwrap());
                        }
                    }
                    _ => {
                        if dq.len() > 0 {
                            out.push(dq.pop_back().unwrap());
                        }
                    }
                }
            }
            out.push(-1);
            while let Some(item) = dq.pop_front() {
                out.push(item);
            }
            Ok::<Vec<i64>, std::convert::Infallible>(out)
        },
        |out| out.len() as u32,
        |out| Value::from(out.clone()),
    );
}
