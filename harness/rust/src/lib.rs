//! In-process half of the benchmark protocol for Rust adapters.
//!
//! The supervisor (harness/supervisor.mjs) launches the adapter binary, reads
//! `@@{json}` lines from its stdout and writes commands to its stdin. This is
//! the Rust counterpart of harness/js/runner.mjs.

use std::alloc::{GlobalAlloc, Layout, System};
use std::io::{BufRead, Write};
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};

static CURRENT: AtomicUsize = AtomicUsize::new(0);
static PEAK: AtomicUsize = AtomicUsize::new(0);

/// Counts live and peak heap bytes exactly. Adapters install it with
/// `#[global_allocator]`.
pub struct CountingAllocator;

fn grew(bytes: usize) {
    let now = CURRENT.fetch_add(bytes, Relaxed) + bytes;
    PEAK.fetch_max(now, Relaxed);
}

unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let ptr = unsafe { System.alloc(layout) };
        if !ptr.is_null() {
            grew(layout.size());
        }
        ptr
    }

    unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
        let ptr = unsafe { System.alloc_zeroed(layout) };
        if !ptr.is_null() {
            grew(layout.size());
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        unsafe { System.dealloc(ptr, layout) };
        CURRENT.fetch_sub(layout.size(), Relaxed);
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        let new_ptr = unsafe { System.realloc(ptr, layout, new_size) };
        if !new_ptr.is_null() {
            if new_size > layout.size() {
                grew(new_size - layout.size());
            } else {
                CURRENT.fetch_sub(layout.size() - new_size, Relaxed);
            }
        }
        new_ptr
    }
}

fn send(phase: &str, extra: &str) {
    let mut out = std::io::stdout().lock();
    writeln!(
        out,
        "@@{{\"phase\":\"{phase}\",\"memory\":{{\"heapUsed\":{},\"heapPeak\":{}}}{extra}}}",
        CURRENT.load(Relaxed),
        PEAK.load(Relaxed),
    )
    .unwrap();
    out.flush().unwrap();
}

/// Call first thing in `main`.
pub fn boot() {
    send("boot", &format!(",\"pid\":{},\"runtime\":\"rust\"", std::process::id()));
}

/// Call once the adapter is able to do its task. `port` is 0 for adapters
/// that do not listen. Serves supervisor commands on a background thread.
pub fn ready(port: u16) {
    send("ready", &format!(",\"port\":{port}"));
    std::thread::spawn(|| {
        for line in std::io::stdin().lock().lines() {
            match line.as_deref() {
                Ok("settle") => send("settled", ""),
                Ok("exit") | Err(_) => break,
                Ok(_) => {}
            }
        }
        std::process::exit(0);
    });
}

#[cfg(feature = "operations")]
pub mod operation;
#[cfg(feature = "operations")]
pub mod async_operation;

#[cfg(feature = "client")]
pub mod client;

#[cfg(feature = "peers")]
pub mod peer;
