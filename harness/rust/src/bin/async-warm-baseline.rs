//! An adapter that does nothing, awaited through the same fixtures and rounds
//! as a real one: the warm baseline for Rust adapters of asynchronous
//! operation tasks. The harness has no executor, so this brings the smallest
//! one there is: poll on this thread and park until woken.

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Wake, Waker};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Unpark(std::thread::Thread);
impl Wake for Unpark {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

fn block_on(mut main: Pin<Box<dyn Future<Output = ()> + '_>>) {
    let waker = Waker::from(Arc::new(Unpark(std::thread::current())));
    let mut context = Context::from_waker(&waker);
    while main.as_mut().poll(&mut context).is_pending() {
        std::thread::park();
    }
}

fn main() {
    bench_harness::async_operation::run(
        block_on,
        |_| (),
        |_| async { Ok::<(), std::convert::Infallible>(()) },
        |_| 1,
        |_, _| serde_json::Value::Null,
    );
}
