//! Synchronous string- and boolean-producing operations on fixtures exported by scenario.mjs.
//! Parsing and validation occur before warm-up. No input mutation
//! is possible through the operation's shared reference.
use serde_json::{Value, json};
use std::{borrow::Cow, hint::black_box, io::{BufRead, Write}, time::Instant};
use std::sync::atomic::Ordering::Relaxed;

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

pub fn run(operation: impl Fn(&Value) -> Result<String, serde_json::Error>) {
    run_impl(operation, false);
}

/// Send outputs to the supervisor's scenario verifier. Wait for its explicit
/// acknowledgement before announcing readiness or executing measured work.
pub fn run_with_external_verification(operation: impl Fn(&Value) -> Result<String, serde_json::Error>) {
    run_impl(operation, true);
}

/// Like `run_with_external_verification`, for operations that can return the
/// input unchanged without copying it, as the other languages' libraries do.
pub fn run_borrowed_with_external_verification(operation: impl for<'a> Fn(&'a Value) -> Result<Cow<'a, str>, serde_json::Error>) {
    run_impl(operation, true);
}

/// Compare already-parsed inputs without allocating or serializing the result.
pub fn run_bool(operation: impl Fn(&Value) -> bool) {
    run_impl(|value: &Value| Ok::<bool, serde_json::Error>(operation(value)), false);
}

trait Output: Into<Value> + std::fmt::Debug {
    fn checksum(&self) -> u32;
}
impl Output for String {
    fn checksum(&self) -> u32 { self.len() as u32 }
}
impl Output for bool {
    fn checksum(&self) -> u32 { u32::from(*self) }
}
impl Output for Cow<'_, str> {
    fn checksum(&self) -> u32 { self.len() as u32 }
}

/// An operation whose output may borrow from its input.
trait Operation<'a> {
    type Out: Output;
    fn call(&self, input: &'a Value) -> Result<Self::Out, serde_json::Error>;
}
impl<'a, F, T: Output> Operation<'a> for F where F: Fn(&'a Value) -> Result<T, serde_json::Error> {
    type Out = T;
    fn call(&self, input: &'a Value) -> Result<T, serde_json::Error> { self(input) }
}

fn run_impl(operation: impl for<'a> Operation<'a>, external: bool) {
    super::boot();
    let file = std::env::args().nth(1).expect("fixture file argument required");
    let fixture: Value = serde_json::from_slice(&std::fs::read(file).unwrap()).unwrap();
    let cases = fixture["cases"].as_array().expect("cases array");
    assert!(!cases.is_empty());
    let stdin = std::io::stdin();
    let mut commands = stdin.lock().lines();
    if external {
        let outputs: Result<Vec<_>, _> = cases.iter().map(|case| operation.call(&case["input"]).map(Into::<Value>::into)).collect::<Result<Vec<Value>, _>>();
        match outputs {
            Ok(outputs) => emit(json!({"phase":"verification", "outputs":outputs})),
            Err(error) => {
                emit(json!({"phase":"verify-failed", "error":error.to_string()}));
                std::process::exit(1);
            }
        }
        if !matches!(commands.next(), Some(Ok(line)) if line == "verified") {
            std::process::exit(1);
        }
    } else {
        for (i, case) in cases.iter().enumerate() {
            match operation.call(&case["input"]).map(Into::<Value>::into) {
                Ok(actual) if actual == case["expected"] => (),
                result => {
                    emit(json!({"phase":"verify-failed", "error":format!("fixture {i}: expected {}; got {result:?}", case["expected"])}));
                    std::process::exit(1);
                }
            }
        }
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
                let input = &cases[(operations + i) % cases.len()]["input"];
                let output = operation.call(black_box(input)).unwrap();
                checksum = checksum.wrapping_add(black_box(&output).checksum());
            }
            operations += count;
            if start.elapsed().as_secs_f64() * 1000.0 >= min_ms { break; }
        }
        let wall_ms = start.elapsed().as_secs_f64() * 1000.0;
        let cpu = cpu_ms() - cpu_before;
        emit(json!({"phase":"round", "operations":operations, "checksum":checksum, "wallMs":wall_ms, "cpuMs":cpu}));
    }
}
