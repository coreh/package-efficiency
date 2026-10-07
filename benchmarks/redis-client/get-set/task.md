# SET and GET strings

One operation sends one command, `SET key value` or `GET key`, and returns the
decoded reply: the string `OK` for a SET, the value for a GET. There are 8
keys with UTF-8 values of 16 to 1,024 bytes, so 16 commands, sent in turn.

The server is not Redis and is not a package under test. It is a scripted
stand-in (`harness/rust/src/bin/redis-peer.rs`) that the harness starts in its
own process on `127.0.0.1`, on a port the system picks, and stops afterwards.
It speaks the Redis protocol (RESP) for exactly these commands and answers
each with a fixed reply; it stores nothing, so a GET is answered the same
whatever was SET. That is a fair stand-in here because what a client does for
these commands (encode the command, read and decode the reply) does not
depend on how the server produced the reply. It is the same program for every
entry, and only the client's process is measured.

What the task fixes:

- **Eight commands in flight**, on eight lanes. A lane sends a command, waits
  for its reply, and only then sends its next one.
- **Connections are the client's design.** A client that multiplexes (ioredis,
  node-redis, Bun's client) keeps one connection and its eight lanes share
  it, so several commands can travel together. A blocking client has one
  connection per lane. No client may open more than sixteen in the whole run.
- No pipelining or batching requested by the adapter, no transactions, no
  authentication, no TLS, no cluster, database 0.

A correct exchange, checked from both ends before anything is measured and
again after every round: the client returns `OK` or the value, and the server
received exactly the commands of the round, each a RESP array of bulk strings
equal, byte for byte, to a scripted command. What clients send when they
connect (`HELLO`, `CLIENT SETINFO`, `CLIENT SETNAME`, `PING`, `SELECT 0`,
`INFO`) is answered and not counted, and another `CLIENT` subcommand gets the
error Redis 7.0 gives one it does not know. Anything else is refused with an
error reply, recorded, and fails the run.

A client that shares one connection is served by one thread of the stand-in,
which then works a good part of the time (20 to 69 % in the first results;
see `peerCpuMs` in the raw rounds). It stayed ahead of every client, and a
real Redis is one thread too, but the size of the batches such a client
receives depends on it.

Values are returned as strings (a client set to return bytes would do less
work). Packages run with their defaults.

See [Client tasks](../../README.md#client-tasks) for the method.
