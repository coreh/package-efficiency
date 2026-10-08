# Tasks still to write

16 categories have no task yet. Each needs something the harness or the package lists do not have; none is a plain writing job. The earlier list of 76 was worked through on 2026-10-07 and 2026-10-08: the harness gained asynchronous tasks, file fixtures, client tasks with scripted peers, and adapters for PyPI, RubyGems and Go-module packages, and tasks were written for the rest.

| Category | What it needs |
| --- | --- |
| Background job queues (`background-job-queues`) | Needs real Redis or SQL, and measures a worker draining a queue, not a client call. May not be comparable. |
| Embedded key-value stores (`embedded-key-value-stores`) | Needs a decision on durability first (some stores fsync on every commit, and waiting is not CPU). |
| File system watching (`file-watching`) | Needs its own kind: the harness applies a change script while the adapter watches, and the check tolerates coalesced events. |
| Git repository access (`git-repository-access`) | Needs a realistic repository as fixtures; packages that run the git command need child CPU counted. |
| HTTP application servers (`http-application-servers`) | Fits the http-server kind once CPU and memory are summed over a process tree (gunicorn, unicorn). |
| Kafka clients (`kafka-client`) | Needs real server software and a JVM. The heaviest of the list. |
| Layered configuration loading (`layered-configuration`) | Ready with file fixtures and environment variables set in prepare, for the common subset (defaults, one file, env overrides). Needs a careful pass: the packages differ a lot. |
| MongoDB clients (`mongodb-client`) | Needs real server software. A BSON codec task would fit the synchronous kind. |
| MySQL clients (`mysql-client`) | Needs real server software. |
| PostgreSQL clients (`postgres-client`) | Needs real server software, or a large stub for one narrow task. See "Peers that are real server software" in README.md. |
| Reactive signals (`reactive-signals`) | The package list has one true signals library. Needs more packages picked by hand before a task is worth writing. |
| SMTP clients (`smtp-client`) | Needs a scripted SMTP sink (about 200 lines) for the client kind. |
| SOCKS proxy clients (`socks-proxy-client`) | Needs a scripted SOCKS5 peer (about 200 lines) for the client kind. Low priority. |
| SSH and SFTP clients (`ssh-client`) | Needs real server software, best as a peer built on the russh crate. |
| WebSocket messaging (`websocket-messaging`) | Needs a scripted WebSocket peer (about 250 lines) for the client kind. |
| gRPC (`grpc-rpc`) | Needs a peer built on the h2 crate (about 300 lines) and a decision on checking in generated code. |

## Known gaps in what exists

- Adapters for PyPI, RubyGems and Go-module packages run in synchronous and client tasks, not yet in asynchronous ones. Several async tasks (retry policies, synchronization primitives, resource pools) left packages out for this reason.
- Go modules do not run in client tasks yet.
- A dozen tasks compare one package with standard-library code only; they need more packages picked by hand.
