//! What every scripted peer of a client task shares: the listener on
//! 127.0.0.1, the record of what was received, and the control channel to the
//! supervisor (harness/client.mjs).
//!
//! A peer is the other end of a client task: the same program for every
//! adapter and language, started by the supervisor in its own process before
//! anything is measured, and stopped by it. A peer speaks just enough of its
//! protocol for the task and is strict about it: whatever it does not expect
//! is refused and recorded, and a run with a recorded refusal fails.
//!
//! Control channel: the peer prints `@@{"phase":"listening","port":…,"pid":…}`
//! once it accepts connections. On stdin, `stats` prints what was received
//! since the last `stats` (counts per scripted exchange, refusals, new
//! connections) and the CPU time the peer has used so far; `exit` or the end
//! of stdin stops the peer, so a peer never outlives its supervisor.

use serde_json::{Value, json};
use std::io::{BufRead, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering::Relaxed};

/// What the peer received. One counter per scripted exchange (a route, a
/// command): a peer calls `accepted(i)` only for a request that matched the
/// script in full.
pub struct Record {
    accepted: Vec<AtomicU64>,
    refused: AtomicU64,
    connections: AtomicU64,
    first_refusal: Mutex<Option<String>>,
}

impl Record {
    pub fn new(exchanges: usize) -> Self {
        Record {
            accepted: (0..exchanges).map(|_| AtomicU64::new(0)).collect(),
            refused: AtomicU64::new(0),
            connections: AtomicU64::new(0),
            first_refusal: Mutex::new(None),
        }
    }

    pub fn accepted(&self, exchange: usize) {
        self.accepted[exchange].fetch_add(1, Relaxed);
    }

    pub fn refused(&self, reason: impl Into<String>) {
        self.refused.fetch_add(1, Relaxed);
        let mut first = self.first_refusal.lock().unwrap();
        if first.is_none() {
            *first = Some(reason.into());
        }
    }

    fn take(&self) -> Value {
        json!({
            "accepted": self.accepted.iter().map(|n| n.swap(0, Relaxed)).collect::<Vec<_>>(),
            "refused": self.refused.swap(0, Relaxed),
            "firstRefusal": self.first_refusal.lock().unwrap().take(),
            "connections": self.connections.swap(0, Relaxed),
        })
    }
}

// User plus system CPU time of this process, all threads.
fn cpu_ms() -> f64 {
    let mut usage = std::mem::MaybeUninit::<libc::rusage>::uninit();
    let result = unsafe { libc::getrusage(libc::RUSAGE_SELF, usage.as_mut_ptr()) };
    assert_eq!(result, 0, "getrusage failed");
    let usage = unsafe { usage.assume_init() };
    let ms = |t: libc::timeval| t.tv_sec as f64 * 1000.0 + t.tv_usec as f64 / 1000.0;
    ms(usage.ru_utime) + ms(usage.ru_stime)
}

fn say(message: Value) {
    let mut out = std::io::stdout().lock();
    writeln!(out, "@@{message}").unwrap();
    out.flush().unwrap();
}

/// The script of the peer: the JSON file named by the first argument.
pub fn script() -> Value {
    let file = std::env::args().nth(1).expect("usage: <peer> <script.json>");
    serde_json::from_slice(&std::fs::read(file).expect("script file")).expect("script is JSON")
}

/// Listen on a port the system picks, on the loopback address only, and give
/// each connection its own thread running `serve`. One thread per connection
/// keeps a peer simple and means no connection ever waits for another one.
/// Does not return.
pub fn listen(record: &'static Record, serve: impl Fn(TcpStream, u16) + Send + Sync + 'static) -> ! {
    let listener = TcpListener::bind(("127.0.0.1", 0)).expect("bind 127.0.0.1");
    let port = listener.local_addr().unwrap().port();
    std::thread::spawn(move || {
        for line in std::io::stdin().lock().lines() {
            match line.as_deref() {
                Ok("stats") => {
                    let mut stats = record.take();
                    stats["phase"] = json!("stats");
                    stats["cpuMs"] = json!(cpu_ms());
                    say(stats);
                }
                Ok("exit") | Err(_) => break,
                Ok(_) => {}
            }
        }
        // `exit`, or the supervisor is gone.
        std::process::exit(0);
    });
    say(json!({"phase": "listening", "port": port, "pid": std::process::id(), "exchanges": record.accepted.len()}));
    let serve: &'static _ = Box::leak(Box::new(serve));
    for stream in listener.incoming() {
        let Ok(stream) = stream else { continue };
        record.connections.fetch_add(1, Relaxed);
        let _ = stream.set_nodelay(true);
        std::thread::spawn(move || serve(stream, port));
    }
    unreachable!()
}
