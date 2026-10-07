//! Client tasks: the adapter is a client library, and one operation is one
//! exchange with a scripted peer that the supervisor (harness/client.mjs)
//! started on 127.0.0.1 before this process. See "Client tasks" in
//! benchmarks/README.md; this is the Rust counterpart of
//! harness/js/client-runner.mjs.
//!
//! The task fixes how many exchanges are in flight (`Peer::concurrency`
//! lanes). In a round of `count` exchanges, lane `w` performs exchanges
//! `w, w + lanes, w + 2·lanes, …` one after another, and exchange `k` uses
//! fixture `k mod fixtures`. A blocking client runs each lane on its own
//! thread (`run_blocking`); an asynchronous one runs each lane as a task on
//! the Tokio runtime the adapter built (`run_tokio`, feature `client-tokio`).
//! CPU time is that of the whole process, all threads, around the round.
use serde_json::{Value, json};
use std::io::{BufRead, Write};
use std::sync::atomic::Ordering::Relaxed;
use std::time::Instant;

/// Where the peer listens and what the task fixes.
pub struct Peer {
    /// Always "127.0.0.1".
    pub host: &'static str,
    pub port: u16,
    /// Exchanges in flight at once: the number of lanes.
    pub concurrency: usize,
    /// The most connections the task lets the client open over the whole run:
    /// what the peer counts. A pool that takes a size is given `concurrency`.
    pub connections: usize,
}

impl Peer {
    /// "127.0.0.1:port"
    pub fn authority(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

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

/// Announce the process and read what the supervisor fixed: the peer and the
/// fixture inputs, which live for the whole process.
fn start() -> (Peer, &'static [Value]) {
    super::boot();
    let file = std::env::var("BENCH_CLIENT_TASK").expect("BENCH_CLIENT_TASK: a client task is run by the supervisor");
    let task: Value = serde_json::from_slice(&std::fs::read(file).unwrap()).unwrap();
    let inputs: Vec<Value> = task["cases"].as_array().expect("cases array").iter().map(|case| case["input"].clone()).collect();
    assert!(!inputs.is_empty());
    let number = |key: &str| task[key].as_u64().unwrap_or_else(|| panic!("{key} missing from the client task")) as usize;
    let peer = Peer { host: "127.0.0.1", port: number("port") as u16, concurrency: number("concurrency"), connections: number("connections") };
    (peer, Box::leak(inputs.into_boxed_slice()))
}

type Commands = std::io::Lines<std::io::StdinLock<'static>>;

/// Hand the result of one exchange per fixture to the supervisor, which
/// compares them with the task's expected results and with what the peer
/// recorded. Nothing is measured before it agrees.
fn verify<E: std::fmt::Display>(outputs: Result<Vec<Value>, E>) -> Commands {
    let mut commands = std::io::stdin().lock().lines();
    match outputs {
        Ok(outputs) => emit(json!({"phase": "verification", "outputs": outputs})),
        Err(error) => {
            emit(json!({"phase": "verify-failed", "error": error.to_string()}));
            std::process::exit(1);
        }
    }
    if !matches!(commands.next(), Some(Ok(line)) if line == "verified") {
        std::process::exit(1);
    }
    commands
}

/// Serve the supervisor's commands. `round(count)` performs `count` exchanges
/// across the lanes and returns the checksum of what came back.
fn serve(commands: Commands, mut round: impl FnMut(usize) -> u32) {
    emit(json!({"phase": "ready"}));
    for line in commands {
        let line = line.unwrap();
        match line.as_str() {
            "exit" => break,
            "settle" => {
                emit(json!({"phase": "settled"}));
                continue;
            }
            _ => (),
        }
        let command: Value = serde_json::from_str(&line).unwrap();
        let count = command["count"].as_u64().filter(|n| *n > 0).expect("positive count") as usize;
        let cpu_before = cpu_ms();
        let start = Instant::now();
        let checksum = round(count);
        let wall_ms = start.elapsed().as_secs_f64() * 1000.0;
        let cpu = cpu_ms() - cpu_before;
        emit(json!({"phase": "round", "requests": count, "checksum": checksum, "wallMs": wall_ms, "cpuMs": cpu}));
    }
}

/// A blocking client. `connect` runs once per lane, outside measured work,
/// and returns that lane's own state (a connection, an agent); `operation`
/// performs one exchange on it and returns what the library gives back.
/// `consume` reads something cheap from a result inside the measured round;
/// `describe` turns a result into JSON for the verifier, before any of it.
pub fn run_blocking<S: Send, T, E: std::fmt::Display>(
    connect: impl Fn(&Peer) -> S,
    operation: impl Fn(&mut S, &Value) -> Result<T, E> + Sync,
    consume: impl Fn(&T) -> u32 + Sync,
    describe: impl Fn(&T) -> Value,
) {
    let (peer, inputs) = start();
    let mut lanes = vec![connect(&peer)];
    let outputs = inputs.iter().map(|input| operation(&mut lanes[0], input).map(|output| describe(&output))).collect();
    let commands = verify(outputs);
    while lanes.len() < peer.concurrency {
        lanes.push(connect(&peer));
    }
    let width = lanes.len();
    let (operation, consume) = (&operation, &consume);
    serve(commands, |count| {
        std::thread::scope(|scope| {
            let running: Vec<_> = lanes
                .iter_mut()
                .enumerate()
                .map(|(lane, state)| {
                    scope.spawn(move || {
                        let mut checksum = 0u32;
                        let mut k = lane;
                        while k < count {
                            let output = match operation(state, &inputs[k % inputs.len()]) {
                                Ok(output) => output,
                                Err(error) => panic!("exchange failed after verification: {error}"),
                            };
                            checksum = checksum.wrapping_add(consume(&output));
                            k += width;
                        }
                        checksum
                    })
                })
                .collect();
            running.into_iter().fold(0u32, |sum, lane| sum.wrapping_add(lane.join().expect("a lane panicked")))
        })
    });
}

/// An asynchronous client on Tokio. The adapter builds the runtime, so the
/// kind of runtime (one thread, or the default of one worker per core) is the
/// adapter's and is said in its notes. `connect` runs once, inside the
/// runtime, and returns the client every lane shares (a pool); `operation`
/// performs one exchange. `consume` and `describe` are as in `run_blocking`.
#[cfg(feature = "client-tokio")]
pub fn run_tokio<C, T, E, F>(
    runtime: tokio::runtime::Runtime,
    connect: impl FnOnce(&Peer) -> C,
    operation: impl Fn(&'static C, &'static Value) -> F + Send + Sync + 'static,
    consume: impl Fn(&T) -> u32 + Send + Sync + 'static,
    describe: impl Fn(&T) -> Value,
) where
    C: Send + Sync + 'static,
    E: std::fmt::Display,
    F: Future<Output = Result<T, E>> + Send + 'static,
{
    let (peer, inputs) = start();
    let client: &'static C = {
        let _inside = runtime.enter();
        Box::leak(Box::new(connect(&peer)))
    };
    let operation: &'static _ = Box::leak(Box::new(operation));
    let consume: &'static _ = Box::leak(Box::new(consume));
    let outputs = runtime.block_on(async {
        let mut outputs = Vec::with_capacity(inputs.len());
        for input in inputs {
            match operation(client, input).await {
                Ok(output) => outputs.push(describe(&output)),
                Err(error) => return Err(error),
            }
        }
        Ok(outputs)
    });
    let commands = verify(outputs);
    let width = peer.concurrency;
    serve(commands, |count| {
        runtime.block_on(async {
            let running: Vec<_> = (0..width)
                .map(|lane| {
                    tokio::spawn(async move {
                        let mut checksum = 0u32;
                        let mut k = lane;
                        while k < count {
                            let output = match operation(client, &inputs[k % inputs.len()]).await {
                                Ok(output) => output,
                                Err(error) => panic!("exchange failed after verification: {error}"),
                            };
                            checksum = checksum.wrapping_add(consume(&output));
                            k += width;
                        }
                        checksum
                    })
                })
                .collect();
            let mut checksum = 0u32;
            for lane in running {
                checksum = checksum.wrapping_add(lane.await.expect("a lane panicked"));
            }
            checksum
        })
    });
}
