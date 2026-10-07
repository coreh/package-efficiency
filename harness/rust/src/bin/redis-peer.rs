//! A scripted stand-in for a Redis server: the peer of the redis-client
//! tasks. It is not a database. It answers each command of its script with
//! the scripted reply, whatever was sent before, and refuses everything else.
//! Usage: redis-peer <script.json>   (see harness/rust/src/peer.rs for the
//! control channel, and "Client tasks" in benchmarks/README.md)
//!
//!   { "commands": [ { "request": ["SET", "user:1", "…"], "reply": "+OK\r\n" },
//!                   { "request": ["GET", "user:1"], "reply": "$1\r\n…\r\n" } ] }
//!
//! `reply` is the exact RESP2 bytes to send; `reply3` may give other bytes
//! for a connection that switched to RESP3 with `HELLO 3` (a null, a map).
//!
//! A command is accepted only as a RESP array of bulk strings
//! (`*<n>\r\n` then `$<len>\r\n<bytes>\r\n` for each argument) whose
//! arguments are, byte for byte, those of a scripted command (the command's
//! name in any case). Anything else, inline commands included, is answered
//! with `-ERR …`, recorded as refused with the reason, and the connection is
//! closed. Commands may be pipelined; the replies to all the commands that
//! arrived together leave in one write, in order.
//!
//! What clients send when they connect is answered and not counted, and is
//! all that is accepted besides the script: `HELLO` (2 or 3, without AUTH),
//! `CLIENT SETINFO`, `CLIENT SETNAME`, `PING`, `SELECT 0`, `INFO`, `QUIT`.
//! Any other `CLIENT` subcommand gets the error reply Redis 7.0 gives an
//! unknown one, and the connection stays open.
//! There is no AUTH, no TLS, no pub/sub, no transactions, no cluster.

use bench_harness::peer::{self, Record};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpStream;

struct Scripted {
    reply: Vec<u8>,
    reply3: Option<Vec<u8>>,
}

enum Parsed {
    /// A whole command and the bytes it took.
    Command(Vec<Vec<u8>>, usize),
    Incomplete,
    Malformed(String),
}

fn line(buffer: &[u8], from: usize) -> Option<(&[u8], usize)> {
    let end = buffer[from..].windows(2).position(|w| w == b"\r\n")?;
    Some((&buffer[from..from + end], from + end + 2))
}

fn number(bytes: &[u8]) -> Option<usize> {
    std::str::from_utf8(bytes).ok()?.parse().ok()
}

fn parse(buffer: &[u8]) -> Parsed {
    if buffer.is_empty() {
        return Parsed::Incomplete;
    }
    if buffer[0] != b'*' {
        return Parsed::Malformed("a command must be a RESP array of bulk strings".into());
    }
    let Some((count, mut at)) = line(buffer, 1) else { return Parsed::Incomplete };
    let Some(count) = number(count).filter(|n| (1..=1024).contains(n)) else {
        return Parsed::Malformed("malformed array length".into());
    };
    let mut arguments = Vec::with_capacity(count);
    for _ in 0..count {
        if at >= buffer.len() {
            return Parsed::Incomplete;
        }
        if buffer[at] != b'$' {
            return Parsed::Malformed("an argument must be a bulk string".into());
        }
        let Some((length, start)) = line(buffer, at + 1) else { return Parsed::Incomplete };
        let Some(length) = number(length).filter(|n| *n <= 64 * 1024 * 1024) else {
            return Parsed::Malformed("malformed bulk string length".into());
        };
        if buffer.len() < start + length + 2 {
            return Parsed::Incomplete;
        }
        if &buffer[start + length..start + length + 2] != b"\r\n" {
            return Parsed::Malformed("a bulk string must end with CRLF".into());
        }
        arguments.push(buffer[start..start + length].to_vec());
        at = start + length + 2;
    }
    Parsed::Command(arguments, at)
}

fn show(command: &[Vec<u8>]) -> String {
    let words: Vec<String> = command.iter().take(4).map(|a| String::from_utf8_lossy(&a[..a.len().min(40)]).into_owned()).collect();
    words.join(" ")
}

const INFO: &str = "# Server\r\nredis_version:7.0.0\r\nredis_mode:standalone\r\n# Persistence\r\nloading:0\r\n# Replication\r\nrole:master\r\n";

/// The reply to one of the commands a client sends while connecting, if it
/// is one. `resp3` is switched by HELLO 3.
fn setup(command: &[Vec<u8>], resp3: &mut bool) -> Option<Result<Vec<u8>, String>> {
    let word = |i: usize| command.get(i).map(|a| String::from_utf8_lossy(a).to_ascii_uppercase());
    let ok = || Some(Ok(b"+OK\r\n".to_vec()));
    match (word(0)?.as_str(), word(1).as_deref()) {
        ("HELLO", version) => {
            let rest: Vec<String> = (2..command.len()).filter_map(word).collect();
            if rest.iter().any(|w| w == "AUTH") {
                return Some(Err("HELLO with AUTH: the peer has no users".into()));
            }
            let three = match version {
                None | Some("2") => false,
                Some("3") => true,
                Some(other) => return Some(Err(format!("HELLO {other}"))),
            };
            *resp3 = three;
            let fields = format!(
                "$6\r\nserver\r\n$5\r\nredis\r\n$7\r\nversion\r\n$5\r\n7.0.0\r\n$5\r\nproto\r\n:{}\r\n$2\r\nid\r\n:1\r\n$4\r\nmode\r\n$10\r\nstandalone\r\n$4\r\nrole\r\n$6\r\nmaster\r\n$7\r\nmodules\r\n*0\r\n",
                if three { 3 } else { 2 }
            );
            Some(Ok(format!("{}{fields}", if three { "%7\r\n" } else { "*14\r\n" }).into_bytes()))
        }
        ("CLIENT", Some("SETINFO" | "SETNAME")) => ok(),
        // A newer client may probe for a feature when it connects (node-redis
        // sends CLIENT MAINT_NOTIFICATIONS). Redis 7.0, which HELLO and INFO
        // say this is, answers a subcommand it does not know with an error
        // and keeps the connection; so does the peer, and the client goes on.
        ("CLIENT", Some(other)) => Some(Ok(format!("-ERR unknown subcommand '{}'. Try CLIENT HELP.\r\n", other.replace(['\r', '\n'], " ")).into_bytes())),
        ("PING", None) => Some(Ok(b"+PONG\r\n".to_vec())),
        ("SELECT", Some("0")) => ok(),
        ("INFO", _) => Some(Ok(format!("${}\r\n{INFO}\r\n", INFO.len()).into_bytes())),
        ("QUIT", None) => ok(),
        _ => None,
    }
}

fn serve(mut stream: TcpStream, script: &HashMap<Vec<Vec<u8>>, usize>, replies: &[Scripted], record: &Record) {
    let mut buffer: Vec<u8> = Vec::with_capacity(16 * 1024);
    let mut chunk = [0u8; 64 * 1024];
    let mut out: Vec<u8> = Vec::with_capacity(16 * 1024);
    let mut resp3 = false;
    loop {
        match stream.read(&mut chunk) {
            Ok(0) | Err(_) => {
                if !buffer.is_empty() {
                    record.refused("connection ended inside a command");
                }
                return;
            }
            Ok(n) => buffer.extend_from_slice(&chunk[..n]),
        }
        let mut at = 0;
        let mut refusal = None;
        loop {
            match parse(&buffer[at..]) {
                Parsed::Incomplete => break,
                Parsed::Malformed(why) => {
                    refusal = Some(why);
                    break;
                }
                Parsed::Command(mut command, used) => {
                    at += used;
                    command[0].make_ascii_uppercase();
                    if let Some(&index) = script.get(&command) {
                        // Recorded before the reply leaves, so the record is
                        // never behind what the client has seen.
                        record.accepted(index);
                        let scripted = &replies[index];
                        out.extend_from_slice(if resp3 { scripted.reply3.as_ref().unwrap_or(&scripted.reply) } else { &scripted.reply });
                    } else {
                        match setup(&command, &mut resp3) {
                            Some(Ok(reply)) => out.extend_from_slice(&reply),
                            Some(Err(why)) => refusal = Some(why),
                            None => refusal = Some(format!("not in the script: {}", show(&command))),
                        }
                        if refusal.is_some() {
                            break;
                        }
                    }
                }
            }
        }
        buffer.drain(..at);
        if let Some(why) = refusal {
            out.extend_from_slice(format!("-ERR refused by the scripted peer: {}\r\n", why.replace(['\r', '\n'], " ")).as_bytes());
            let _ = stream.write_all(&out);
            record.refused(why);
            return;
        }
        if !out.is_empty() {
            if stream.write_all(&out).is_err() {
                return;
            }
            out.clear();
        }
    }
}

fn main() {
    let script = peer::script();
    let commands = script["commands"].as_array().expect("commands");
    assert!(!commands.is_empty(), "the script has no commands");
    let mut index = HashMap::new();
    let mut replies = Vec::new();
    for (i, command) in commands.iter().enumerate() {
        let mut request: Vec<Vec<u8>> = command["request"].as_array().expect("request").iter().map(|a| a.as_str().expect("request arguments are strings").as_bytes().to_vec()).collect();
        assert!(!request.is_empty(), "command {i} is empty");
        request[0].make_ascii_uppercase();
        assert!(index.insert(request, i).is_none(), "command {i} is scripted twice");
        replies.push(Scripted {
            reply: command["reply"].as_str().expect("reply").as_bytes().to_vec(),
            reply3: command["reply3"].as_str().map(|r| r.as_bytes().to_vec()),
        });
    }
    let index: &'static HashMap<_, _> = Box::leak(Box::new(index));
    let replies: &'static [Scripted] = Box::leak(replies.into_boxed_slice());
    let record: &'static Record = Box::leak(Box::new(Record::new(replies.len())));
    peer::listen(record, move |stream, _port| serve(stream, index, replies, record));
}
