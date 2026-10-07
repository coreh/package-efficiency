//! How fast the HTTP peer answers when the client does next to nothing: the
//! ceiling a client of an http-client task could reach before the peer is
//! what it waits for. Run by scripts/peer-ceiling.mjs, never as part of a
//! measurement.
//! Usage: http-peer-ceiling <port> <connections> <requests per connection> <path>
//!
//! Each connection has its own thread, which writes one prebuilt request and
//! reads until the whole response is there (the first response gives its
//! size), with no parsing after that. Prints
//! `{"requests":…,"wallMs":…,"cpuMs":…}` for this process.
use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Instant;

fn cpu_ms() -> f64 {
    let mut usage = std::mem::MaybeUninit::<libc::rusage>::uninit();
    assert_eq!(unsafe { libc::getrusage(libc::RUSAGE_SELF, usage.as_mut_ptr()) }, 0);
    let usage = unsafe { usage.assume_init() };
    let ms = |t: libc::timeval| t.tv_sec as f64 * 1000.0 + t.tv_usec as f64 / 1000.0;
    ms(usage.ru_utime) + ms(usage.ru_stime)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let [_, port, connections, each, path] = &args[..] else { panic!("usage: http-peer-ceiling <port> <connections> <requests per connection> <path>") };
    let (port, connections, each): (u16, usize, usize) = (port.parse().unwrap(), connections.parse().unwrap(), each.parse().unwrap());
    let request = format!("GET {path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n\r\n").into_bytes();
    let mut streams: Vec<TcpStream> = (0..connections).map(|_| TcpStream::connect(("127.0.0.1", port)).unwrap()).collect();
    // The size of one response, from a first exchange on each connection.
    let mut size = 0;
    for stream in &mut streams {
        stream.set_nodelay(true).unwrap();
        stream.write_all(&request).unwrap();
        let mut seen = Vec::new();
        let mut chunk = [0u8; 65536];
        size = loop {
            let n = stream.read(&mut chunk).unwrap();
            assert!(n > 0, "the peer closed the connection");
            seen.extend_from_slice(&chunk[..n]);
            if let Some(head) = seen.windows(4).position(|w| w == b"\r\n\r\n") {
                let text = std::str::from_utf8(&seen[..head]).unwrap();
                assert!(text.starts_with("HTTP/1.1 200"), "{text}");
                let length: usize = text.lines().find_map(|l| l.strip_prefix("Content-Length: ")).unwrap().parse().unwrap();
                if seen.len() >= head + 4 + length {
                    break head + 4 + length;
                }
            }
        };
    }
    let (cpu, start) = (cpu_ms(), Instant::now());
    std::thread::scope(|scope| {
        for stream in &mut streams {
            let request = &request;
            scope.spawn(move || {
                let mut chunk = [0u8; 65536];
                for _ in 0..each {
                    stream.write_all(request).unwrap();
                    let mut got = 0;
                    while got < size {
                        let n = stream.read(&mut chunk).unwrap();
                        assert!(n > 0, "the peer closed the connection");
                        got += n;
                    }
                }
            });
        }
    });
    println!("{{\"requests\":{},\"wallMs\":{},\"cpuMs\":{}}}", connections * each, start.elapsed().as_secs_f64() * 1000.0, cpu_ms() - cpu);
}
