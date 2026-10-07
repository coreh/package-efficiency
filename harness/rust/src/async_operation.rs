//! Asynchronous operations (task kind "async-operation"): the counterpart of
//! `operation::run_prepared` for an operation that returns a future. See
//! "Asynchronous operations" in benchmarks/README.md.
//!
//! The harness has no executor. The adapter brings the runtime its crate is
//! built for and hands it over as `block_on`: the whole run (verification,
//! warm-up, every round) is one future driven by that single call, and each
//! operation is one `.await` inside it, as a JavaScript process awaits inside
//! its one event loop. Entering the executor is therefore never timed.
//!
//! ```ignore
//! let runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
//! bench_harness::async_operation::run(
//!     |main| runtime.block_on(main),
//!     |input| prepare(input),                 // once per fixture, not timed
//!     |input| async move { work(input).await }, // timed, awaited
//!     |output| output.len() as u32,           // timed: read something cheap
//!     |_input, output| serde_json::json!(output), // not timed: for the verifier
//! );
//! ```
//!
//! A future must complete only when all of its work is done. After the last
//! operation of a round the executor is given one more turn inside the timed
//! part (`yield_now`), so tasks left spawned are charged to the round.
//!
//! An operation that blocks instead (it starts threads and joins them) is a
//! synchronous call: use `operation::run_prepared`.
use serde_json::{Value, json};
use std::future::Future;
use std::hint::black_box;
use std::io::{BufRead, Write};
use std::pin::Pin;
use std::sync::atomic::Ordering::Relaxed;
use std::task::{Context, Poll};
use std::time::Instant;

fn emit(mut message: Value) {
    message["memory"] = json!({
        "heapUsed": super::CURRENT.load(Relaxed),
        "heapPeak": super::PEAK.load(Relaxed),
    });
    let mut stdout = std::io::stdout().lock();
    writeln!(stdout, "@@{message}").unwrap();
    stdout.flush().unwrap();
}

// Same definition as process.cpuUsage(): user + system CPU, all threads.
fn cpu_ms() -> f64 {
    let mut usage = std::mem::MaybeUninit::<libc::rusage>::uninit();
    let result = unsafe { libc::getrusage(libc::RUSAGE_SELF, usage.as_mut_ptr()) };
    assert_eq!(result, 0, "getrusage failed");
    let usage = unsafe { usage.assume_init() };
    let ms = |t: libc::timeval| t.tv_sec as f64 * 1000.0 + t.tv_usec as f64 / 1000.0;
    ms(usage.ru_utime) + ms(usage.ru_stime)
}

/// Gives the executor one turn: the task is woken at once and polled again
/// after whatever else is ready. It works on any executor, so adapters of
/// executor-neutral crates can use it where a task has to yield.
pub fn yield_now() -> impl Future<Output = ()> {
    struct YieldNow(bool);
    impl Future for YieldNow {
        type Output = ();
        fn poll(mut self: Pin<&mut Self>, context: &mut Context<'_>) -> Poll<()> {
            if self.0 {
                return Poll::Ready(());
            }
            self.0 = true;
            context.waker().wake_by_ref();
            Poll::Pending
        }
    }
    YieldNow(false)
}

/// Runs an adapter whose operation is a future. `block_on` drives the one
/// future it is given to completion on the adapter's executor; `prepare`,
/// `consume` and `describe` are as in `operation::run_prepared`.
pub fn run<I: 'static, T, E: std::fmt::Display, F: Future<Output = Result<T, E>>>(
    block_on: impl for<'a> FnOnce(Pin<Box<dyn Future<Output = ()> + 'a>>),
    prepare: impl Fn(&'static Value) -> I,
    operation: impl Fn(&'static I) -> F,
    consume: impl Fn(&T) -> u32,
    describe: impl Fn(&Value, &T) -> Value,
) {
    super::boot();
    let file = std::env::args().nth(1).expect("fixture file argument required");
    let fixture: &'static Value = Box::leak(Box::new(serde_json::from_slice(&std::fs::read(file).unwrap()).unwrap()));
    let cases = fixture["cases"].as_array().expect("cases array");
    assert!(!cases.is_empty());
    // Fixtures and prepared inputs live for the whole process, so a future
    // may borrow its input without any lifetime on the operation.
    let inputs: &'static [I] = Box::leak(cases.iter().map(|case| prepare(&case["input"])).collect::<Vec<I>>().into_boxed_slice());
    block_on(Box::pin(async move {
        let stdin = std::io::stdin();
        let mut commands = stdin.lock().lines();
        let mut outputs = Vec::with_capacity(inputs.len());
        for (case, input) in cases.iter().zip(inputs) {
            match operation(input).await {
                Ok(output) => outputs.push(describe(&case["input"], &output)),
                Err(error) => {
                    emit(json!({"phase":"verify-failed", "error":error.to_string()}));
                    std::process::exit(1);
                }
            }
        }
        emit(json!({"phase":"verification", "outputs":outputs}));
        if !matches!(commands.next(), Some(Ok(line)) if line == "verified") {
            std::process::exit(1);
        }
        emit(json!({"phase":"ready"}));
        for line in commands {
            let line = line.unwrap();
            match line.as_str() {
                "exit" => break,
                "settle" => { emit(json!({"phase":"settled"})); continue; },
                _ => (),
            }
            let command: Value = serde_json::from_str(&line).unwrap();
            let count = command["count"].as_u64().filter(|n| *n > 0).expect("positive count") as usize;
            let min_ms = command["minMs"].as_f64().unwrap_or(0.0);
            let mut operations = 0usize;
            let mut checksum = 0u32;
            let cpu_before = cpu_ms();
            let start = Instant::now();
            loop {
                for i in 0..count {
                    let input = &inputs[(operations + i) % inputs.len()];
                    let output = match operation(black_box(input)).await {
                        Ok(output) => output,
                        Err(error) => panic!("operation failed after verification: {error}"),
                    };
                    checksum = checksum.wrapping_add(consume(black_box(&output)));
                }
                operations += count;
                if start.elapsed().as_secs_f64() * 1000.0 >= min_ms { break; }
            }
            yield_now().await;
            let wall_ms = start.elapsed().as_secs_f64() * 1000.0;
            let cpu = cpu_ms() - cpu_before;
            emit(json!({"phase":"round", "operations":operations, "checksum":checksum, "wallMs":wall_ms, "cpuMs":cpu}));
        }
    }));
    // The supervisor has said "exit" or closed stdin. Worker threads of a
    // multi-thread executor must not keep the process alive.
    std::process::exit(0);
}
