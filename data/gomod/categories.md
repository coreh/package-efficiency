# Package categories: Go modules

1000 of 1000 packages categorized into 96 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Other (no peers yet) (`other`) | 222 | no |  |
| Service SDKs and telemetry (`service-sdks`) | 119 | no |  |
| Build, lint and test tooling (`build-tooling`) | 116 | no |  |
| System and foreign bindings (`system-bindings`) | 47 | no |  |
| Library internals (`library-internals`) | 37 | no |  |
| Applications and daemons (`applications`) | 32 | no |  |
| Generated API and schema types (`generated-api-types`) | 29 | no |  |
| Structured logging (`structured-logging`) | 18 | yes | Log 1,000,000 records with five key-value fields each as JSON lines to a null sink. |
| Language-level abstractions (`language-ergonomics`) | 17 | no |  |
| Environment detection (`environment-detection`) | 17 | no |  |
| Tooling internals (AST and code utilities) (`tooling-internals`) | 14 | no |  |
| Framework and tool extensions (`framework-extensions`) | 14 | no |  |
| Binary serialization (`binary-serialization`) | 13 | yes | Encode and decode 100,000 records with nested integers, strings and arrays. |
| Frameworks and broad libraries (`frameworks`) | 12 | no |  |
| Non-deflate compression (`block-compression`) | 12 | yes | Compress and decompress a fixed 32 MB mixed text and binary corpus at the default level. |
| Macro and derive support (`macro-support`) | 12 | no |  |
| Unique ID generation (`id-generation`) | 10 | yes | Generate one million random unique IDs using the package's default secure generator. |
| CLI argument parsing (`cli-argument-parsing`) | 9 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| HTTP server routing (`http-server-routing`) | 9 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| INI and properties parsing (`ini-parsing`) | 9 | yes | Parse the same 5,000-line INI document of sections and key=value pairs, then read every value back by section and key. |
| JSON path queries (`json-path-query`) | 8 | yes | Compile a fixed set of path expressions and evaluate each against a 1 MB nested document. |
| Metrics instrumentation (`metrics-instrumentation`) | 8 | yes | Register 100 labelled counters, gauges and histograms, apply 10,000,000 updates from several threads, then render one text snapshot of the registry. |
| Terminal string styling (`terminal-styling`) | 7 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Value inspection and formatting (`value-inspection`) | 7 | yes | Format a fixed set of nested objects, arrays, Maps, Sets and primitives into strings. |
| HTTP clients (`http-client`) | 7 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| Non-cryptographic hashing (`non-cryptographic-hashing`) | 7 | yes | Hash 1,000,000 short keys and one 64 MB buffer to a 64-bit value. |
| Text diffing (`text-diff`) | 7 | yes | Diff pairs of 10,000-line text files that differ by 1%, 10% and 50% of their lines. |
| Embedded key-value stores (`embedded-key-value-stores`) | 7 | yes | Write 1,000,000 key-value pairs in batches to a fresh on-disk store, read each back at random, then scan a key range in order. |
| Schema validation (`schema-validation`) | 6 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| Static data and patterns (`static-data`) | 6 | no |  |
| Histograms and quantile sketches (`quantile-sketches`) | 6 | yes | Record a fixed stream of 10,000,000 latency samples and query the 50th, 90th, 99th and 99.9th percentiles. |
| Config format parsing (`config-format-parsing`) | 5 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| Identifier case conversion (`case-conversion`) | 5 | yes | Convert 1,000,000 mixed identifiers to snake, camel and kebab case. |
| Retry policies (`retry-policies`) | 5 | yes | Wrap a function that fails a fixed number of times before succeeding and call it 100,000 times with zero delay. |
| Shell word splitting (`shell-word-splitting`) | 5 | yes | Split a fixed list of 100,000 command lines with mixed single quotes, double quotes and backslash escapes into their argument words. |
| JSON parsing (`json-parsing`) | 4 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| JWT signing and verification (`jwt-signing`) | 4 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 4 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| LRU caches (`lru-cache`) | 4 | yes | Replay a fixed Zipf-distributed trace of 1,000,000 get/set operations against a cache capped at 10,000 entries. |
| ASN.1 DER decoding (`asn1-der-decoding`) | 4 | yes | Decode a fixed set of 1,000 DER-encoded X.509 certificates into their fields. |
| WebSocket messaging (`websocket-messaging`) | 4 | yes | Echo 100,000 text and binary messages over a loopback connection, or through the codec in memory. |
| Template rendering (`template-rendering`) | 4 | yes | Compile a template that loops over 1,000 records with a conditional and escaped interpolation, then render it 1,000 times. |
| Semantic version comparison (`semver-comparison`) | 4 | yes | Parse a fixed list of 10,000 version strings, sort them, and test each against a fixed set of range constraints. |
| Sorted maps and prefix trees (`sorted-maps`) | 4 | yes | Insert 1,000,000 string keys, look each up, then run a fixed set of range and prefix scans in key order. |
| Glob matching (`glob-matching`) | 3 | yes | Compile a fixed set of glob patterns and match each against a fixed list of 10,000 path strings. |
| URL and URI parsing (`url-parsing`) | 3 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| UI components and hooks (`ui-components`) | 3 | no |  |
| TOML parsing (`toml-parsing`) | 3 | yes | Parse a fixed corpus of TOML documents, including a 5,000-line lockfile. |
| Digital signatures (`digital-signatures`) | 3 | yes | Generate a key pair, then sign and verify 10,000 short messages. |
| Date and time (`date-time`) | 3 | yes | Parse 100,000 ISO 8601 timestamps, add calendar durations and format each back to a string. |
| Markdown rendering (`markdown-parsing`) | 3 | yes | Render a fixed corpus of Markdown documents totalling several megabytes to HTML. |
| Text table rendering (`text-table-rendering`) | 3 | yes | Render a table of 10,000 rows and 8 mixed-type columns to a string. |
| PostgreSQL clients (`postgres-client`) | 3 | yes | Against a local PostgreSQL server, insert 100,000 rows with a prepared statement and read them back. |
| Redis clients (`redis-client`) | 3 | yes | Against a local Redis server, run 100,000 SET and GET commands, both one at a time and in pipelines of 100. |
| Dotenv loading (`dotenv-loading`) | 3 | yes | Parse the same .env text of 1,000 assignments with quotes, comments and variable references into a key-value map. |
| File system watching (`file-watching`) | 3 | yes | Watch a directory tree of 1,000 files, apply a fixed script of 10,000 creates, writes and removes, and collect every resulting event. |
| Recursive file copying (`recursive-file-copy`) | 3 | yes | Copy a fixed directory tree of 10,000 small files in nested directories to an empty destination. |
| Deep cloning (`deep-cloning`) | 3 | yes | Deep-copy the same nested value of 10,000 maps, lists and records 100 times and verify the copies share no mutable state. |
| Human-readable size formatting (`human-size-formatting`) | 3 | yes | Format a fixed list of 1,000,000 byte counts as human-readable sizes and parse each resulting string back to a number. |
| MongoDB clients (`mongodb-client`) | 3 | yes | Against a local server, insert 10,000 documents into a collection and read them back with a query that returns ten fields each. |
| Source map decoding (`source-map-decoding`) | 2 | yes | Load one large real-world source map and decode all of its mappings into position segments. |
| Deep equality (`deep-equality`) | 2 | yes | Compare a fixed set of equal and unequal pairs of nested objects, arrays, Maps and Dates. |
| Object merging (`object-merging`) | 2 | yes | Merge a fixed sequence of nested plain option objects into one result object, 100,000 times. |
| Directory walking (`directory-walking`) | 2 | yes | Recursively list every file in a fixture tree of roughly 10,000 files across nested directories. |
| Tar archiving (`tar-archiving`) | 2 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Terminal string width (`terminal-string-width`) | 2 | yes | Compute the display width of 100,000 strings mixing ASCII, CJK and emoji characters. |
| Indentation stripping (`indentation-stripping`) | 2 | yes | Strip the common leading indentation from 10,000 multi-line text blocks of varying depth. |
| Bit sets (`bit-sets`) | 2 | yes | Set and test 1,000,000 pseudo-random bit positions, then union, intersect and count two sets. |
| Cryptographic hashing (`cryptographic-hashing`) | 2 | yes | Digest a 64 MB buffer and 100,000 64-byte messages with the package's primary algorithm. |
| Regular expression matching (`regex-matching`) | 2 | yes | Compile a fixed set of 20 patterns and find all matches of each in a 10 MB text corpus. |
| CSS selector matching (`css-selector-matching`) | 2 | yes | Run a fixed list of 100 selectors against a parsed 1 MB HTML document and count the matches. |
| Immutable collections (`immutable-collections`) | 2 | yes | Build a 100,000-entry immutable map by successive inserts, then run a fixed mix of lookups and updates on it. |
| Chart rendering (`chart-rendering`) | 2 | yes | Render a line chart with 10 series of 10,000 points each to SVG or PNG. |
| File locking (`file-locking`) | 2 | yes | Acquire and release an uncontended lock file 100,000 times, then repeat with several contending processes. |
| MySQL clients (`mysql-client`) | 2 | yes | Against a local MySQL server, insert 100,000 rows with a prepared statement and read them back. |
| Message translation (`message-translation`) | 2 | yes | Load a catalog of 5,000 messages in two locales and perform 100,000 lookups with interpolation and pluralization. |
| Runtime helpers and shims (`runtime-shims`) | 1 | no |  |
| HTML and XML parsing (`markup-parsing`) | 1 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| Filesystem globbing (`file-globbing`) | 1 | yes | Expand a fixed set of glob patterns such as **/*.js against a fixture directory tree and collect the matching paths. |
| Async concurrency control (`async-concurrency`) | 1 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| Event emitters (`event-emitter`) | 1 | yes | Register 10 listeners on each of several event names and emit one million events with two arguments. |
| Deflate compression (`deflate-compression`) | 1 | yes | Gzip and then gunzip the same 10 MB mixed text and binary buffer. |
| Color parsing and conversion (`css-color-parsing`) | 1 | yes | Parse a fixed list of 100,000 hex, rgb() and hsl() color strings and convert each to an RGB triple. |
| Hash maps (`hash-maps`) | 1 | yes | Insert 1,000,000 integer and string keys, look each up, iterate, then remove half. |
| Message channels (`message-channels`) | 1 | yes | Send 1,000,000 small messages from four producers to one consumer through a bounded channel. |
| Checksums (`checksums`) | 1 | yes | Checksum a 64 MB buffer in one call and again in 4 KB incremental updates. |
| Random number generation (`random-number-generation`) | 1 | yes | Seed a generator, draw 10,000,000 64-bit integers and fill a 64 MB buffer. |
| Base64 encoding (`base64-encoding`) | 1 | yes | Encode and decode a 16 MB buffer and 100,000 32-byte values with the standard alphabet. |
| Parser combinators and generators (`parser-combinators`) | 1 | yes | Implement the same JSON grammar with each library and parse a 10 MB JSON document. |
| HTML sanitizing (`html-sanitizing`) | 1 | yes | Sanitize a fixed set of 1,000 HTML fragments containing scripts, event handlers and unknown tags with a default allow-list. |
| Typed object mapping (`typed-object-mapping`) | 1 | yes | Build 100,000 nested record objects from plain dictionaries and convert them back to dictionaries. |
| Dataframes (`dataframes`) | 1 | yes | Load a 1,000,000-row table, filter it, group by a key column and compute sum and mean aggregates. |
| Image processing (`image-processing`) | 1 | yes | Decode a fixed set of JPEG and PNG photos, resize each to a thumbnail and re-encode it. |
| PDF reading (`pdf-text-extraction`) | 1 | yes | Extract the text of every page from a fixed set of PDF documents totalling 1,000 pages. |
| PDF generation (`pdf-generation`) | 1 | yes | Generate a 100-page PDF of paragraphs and a table from fixed input data. |
| Dynamic attribute objects (`dynamic-attribute-objects`) | 1 | yes | Wrap a fixed nested document of 1,000 keys and perform 100,000 attribute reads and writes at varying depths. |

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `github.com/kr/text` #16, 198,489 dependents (low confidence: paragraph wrapping/indent text helpers; no clear peer)
- `golang.org/x/time` #47, 138,657 dependents (low confidence: rate limiter and time utilities; no peer)
- `github.com/google/gofuzz` #49, 132,006 dependents (low confidence: populates Go values with random data for fuzzing; no peer)
- `github.com/golang/groupcache` #56, 125,744 dependents (low confidence: distributed cache with peer de-duplication; no peer)
- `github.com/google/renameio` #64, 120,047 dependents (low confidence: atomic file replacement; explicitly out of scope for recursive-file-copy)
- `github.com/go-logfmt/logfmt` #74, 109,669 dependents (low confidence: logfmt encode/decode; no peer except kr/logfmt)
- `github.com/spf13/afero` #79, 107,896 dependents (low confidence: virtual filesystem abstraction; out of scope for recursive-file-copy)
- `github.com/spf13/cast` #97, 102,491 dependents (low confidence: type conversion helpers (cast); no peer)
- `github.com/kr/logfmt` #99, 102,292 dependents (low confidence: logfmt decoder; same task as go-logfmt)
- `github.com/cpuguy83/go-md2man/v2` #110, 100,432 dependents (low confidence: converts markdown to roff man pages, not HTML)
- `gopkg.in/tomb.v1` #111, 99,833 dependents (low confidence: goroutine lifecycle helper)
- `github.com/mwitkow/go-conntrack` #114, 98,821 dependents (low confidence: net connection tracking metrics wrapper)
- `github.com/spf13/viper` #116, 97,868 dependents (low confidence: layered configuration manager, explicitly out of scope for ini/dotenv)
- `github.com/hpcloud/tail` #121, 96,790 dependents (low confidence: tails the appended lines of a log file, out of scope for file-watching)
- `github.com/chzyer/readline` #122, 96,252 dependents (low confidence: terminal line editing library)
- `github.com/shurcooL/sanitized_anchor_name` #128, 92,275 dependents (low confidence: anchor slug sanitizer)
- `github.com/ianlancetaylor/demangle` #129, 90,975 dependents (low confidence: C++/Rust symbol demangler)
- `github.com/jtolds/gls` #143, 82,349 dependents (low confidence: goroutine-local storage)
- `github.com/bgentry/speakeasy` #145, 80,129 dependents (low confidence: password prompt without echo)
- `github.com/miekg/dns` #149, 78,390 dependents (low confidence: DNS library)
- `github.com/jonboulle/clockwork` #152, 75,231 dependents (low confidence: fake clock for tests)
- `github.com/posener/complete` #159, 73,252 dependents (low confidence: shell completion generator)
- `github.com/xiang90/probing` #165, 71,859 dependents (low confidence: health probing between nodes)
- `github.com/pascaldekloe/goe` #166, 71,749 dependents (low confidence: unrecognized small utility)
- `github.com/coreos/pkg` #167, 71,625 dependents (low confidence: grab-bag of utility packages)
- `github.com/soheilhy/cmux` #168, 71,444 dependents (low confidence: connection multiplexer by payload)
- `github.com/hashicorp/go-sockaddr` #170, 70,949 dependents (low confidence: socket address and IP helpers)
- `github.com/tmc/grpc-websocket-proxy` #171, 70,749 dependents (low confidence: proxies websockets to gRPC)
- `github.com/hashicorp/go-rootcerts` #172, 70,718 dependents (low confidence: loads CA certificates for TLS)
- `github.com/armon/circbuf` #177, 69,214 dependents (low confidence: circular buffer)
- `github.com/hashicorp/memberlist` #178, 69,172 dependents (low confidence: gossip cluster membership library)
- `github.com/hashicorp/go-syslog` #182, 68,574 dependents (low confidence: syslog writer)
- `github.com/hashicorp/mdns` #185, 67,489 dependents (low confidence: mDNS library)
- `github.com/mailru/easyjson` #186, 67,176 dependents (low confidence: JSON code generator with marshaler helpers)
- `github.com/prometheus/tsdb` #195, 60,336 dependents (low confidence: time series storage database)
- `github.com/nxadm/tail` #199, 59,688 dependents (low confidence: tail follower for files)
- `github.com/mitchellh/iochan` #201, 58,952 dependents (low confidence: no clear peers)
- `github.com/hashicorp/go.net` #202, 58,111 dependents (low confidence: fork of x/net)
- `github.com/go-openapi/jsonreference` #219, 53,054 dependents (low confidence: JSON reference parsing, no peers)
- `github.com/pkg/sftp` #222, 52,308 dependents
- `github.com/gregjones/httpcache` #231, 48,545 dependents
- `github.com/valyala/bytebufferpool` #232, 47,683 dependents
- `github.com/gorilla/context` #239, 46,896 dependents
- `github.com/tidwall/pretty` #245, 44,589 dependents (low confidence: JSON prettifier)
- `gopkg.in/cheggaaa/pb.v1` #246, 44,461 dependents
- `github.com/google/go-querystring` #247, 44,458 dependents
- `github.com/evanphx/json-patch` #251, 44,181 dependents
- `github.com/elazarl/goproxy` #261, 42,211 dependents
- `github.com/munnerz/goautoneg` #263, 41,822 dependents
- `github.com/Azure/go-ansiterm` #266, 40,992 dependents (low confidence: ANSI terminal parser)
- `gopkg.in/natefinch/lumberjack.v2` #278, 39,753 dependents
- `github.com/mxk/go-flowrate` #280, 39,401 dependents (low confidence: rate-limited io readers)
- `github.com/jinzhu/inflection` #281, 38,832 dependents
- `github.com/eapache/queue` #284, 37,407 dependents
- `github.com/benbjohnson/clock` #289, 36,875 dependents
- `github.com/Shopify/sarama` #290, 36,794 dependents
- `github.com/docker/go-connections` #300, 34,367 dependents (low confidence: network connection helpers)
- `github.com/oklog/run` #307, 33,499 dependents
- `github.com/go-task/slim-sprig` #309, 32,560 dependents (low confidence: Template function library for text/template, not a template engine)
- `github.com/denisenkom/go-mssqldb` #312, 32,069 dependents
- `github.com/josharian/intern` #315, 31,908 dependents
- `github.com/docker/spdystream` #319, 30,953 dependents (low confidence: SPDY stream multiplexing; no peers)
- `github.com/pquerna/cachecontrol` #322, 30,632 dependents
- `github.com/xeipuuv/gojsonreference` #323, 30,612 dependents (low confidence: JSON reference parsing; no description)
- `github.com/mitchellh/go-wordwrap` #326, 30,471 dependents
- `github.com/jmoiron/sqlx` #330, 29,495 dependents (low confidence: database/sql extensions; no peers)
- `github.com/pkg/profile` #339, 28,348 dependents
- `github.com/nats-io/nats.go` #340, 28,313 dependents
- `github.com/mitchellh/reflectwalk` #341, 28,199 dependents (low confidence: Reflection-based structure walker; no peers)
- `github.com/streadway/amqp` #342, 28,168 dependents
- `github.com/montanaflynn/stats` #347, 27,358 dependents
- `github.com/gliderlabs/ssh` #354, 26,795 dependents
- `github.com/armon/go-socks5` #359, 25,808 dependents (low confidence: SOCKS5 server; no description)
- `github.com/containerd/continuity` #360, 25,667 dependents (low confidence: Filesystem manifest and copy tooling; no description)
- `github.com/Knetic/govaluate` #372, 25,129 dependents (low confidence: Expression evaluator; no description)
- `github.com/valyala/tcplisten` #375, 24,834 dependents
- `github.com/labstack/gommon` #393, 22,864 dependents (low confidence: Grab-bag utilities (color, log, bytes); no description)
- `gorm.io/gorm` #398, 22,361 dependents (low confidence: ORM; no ORM peers in taxonomy)
- `github.com/samuel/go-zookeeper` #399, 22,324 dependents (low confidence: ZooKeeper client; no description)
- `github.com/cyphar/filepath-securejoin` #405, 21,974 dependents (low confidence: Symlink-safe path joining; no peers)
- `github.com/moby/spdystream` #408, 21,746 dependents (low confidence: SPDY stream multiplexing; no peers)
- `github.com/huandu/xstrings` #410, 21,740 dependents (low confidence: String algorithm helpers; no peers)
- `github.com/golang/freetype` #412, 21,651 dependents (low confidence: Font rasterization onto images; no peers)
- `github.com/casbin/casbin/v2` #413, 21,595 dependents (low confidence: Authorization policy engine; no peers)
- `github.com/fatih/structs` #415, 21,470 dependents (low confidence: Struct-to-map utilities; no peers)
- `github.com/xdg-go/stringprep` #425, 21,156 dependents (low confidence: RFC 3454 stringprep; no peers except its xdg duplicate)
- `github.com/xdg-go/scram` #427, 21,093 dependents (low confidence: SCRAM SASL auth; no peers except its xdg duplicate)
- `github.com/xdg-go/pbkdf2` #431, 21,044 dependents (low confidence: PBKDF2 key derivation; password-hashing excludes general KDF)
- `github.com/xanzy/ssh-agent` #443, 20,285 dependents (low confidence: SSH agent client; no peers)
- `github.com/containerd/ttrpc` #450, 20,171 dependents (low confidence: Low-level RPC protocol; no peers)
- `github.com/youmark/pkcs8` #460, 19,859 dependents (low confidence: PKCS#8 key parsing; no peers)
- `github.com/Masterminds/goutils` #465, 19,393 dependents (low confidence: String utilities; no peers)
- `github.com/xdg/stringprep` #475, 19,014 dependents (low confidence: RFC 3454 stringprep; no peers except its xdg-go duplicate)
- `github.com/jackc/pgpassfile` #477, 18,982 dependents (low confidence: Parser for .pgpass files; no peers)
- `github.com/xdg/scram` #478, 18,975 dependents (low confidence: SCRAM SASL auth; deprecated duplicate)
- `github.com/shurcooL/go` #482, 18,482 dependents (low confidence: Unrecognized grab-bag package)
- `github.com/getkin/kin-openapi` #483, 18,476 dependents (low confidence: OpenAPI loader and validator; no peers)
- `github.com/fogleman/gg` #500, 18,004 dependents (low confidence: 2D graphics drawing; no peers)
- `github.com/jackc/puddle` #503, 17,921 dependents (low confidence: generic resource pool, no peers)
- `modernc.org/mathutil` #504, 17,875 dependents (low confidence: math utility grab bag)
- `github.com/jackc/pgmock` #505, 17,819 dependents (low confidence: PostgreSQL server mock, no peers)
- `github.com/xlab/treeprint` #515, 17,349 dependents (low confidence: ASCII tree rendering, no peers)
- `modernc.org/strutil` #520, 17,197 dependents (low confidence: string utilities)
- `github.com/agnivade/levenshtein` #521, 17,177 dependents
- `github.com/hashicorp/yamux` #522, 17,112 dependents (low confidence: stream multiplexer, no peers)
- `github.com/gorilla/securecookie` #528, 16,980 dependents
- `github.com/bugsnag/panicwrap` #532, 16,907 dependents (low confidence: panic capture wrapper)
- `github.com/dimchansky/utfbom` #533, 16,889 dependents (low confidence: BOM detection, not encoding guessing)
- `github.com/hashicorp/go-plugin` #544, 16,164 dependents (low confidence: plugin RPC system over subprocesses)
- `github.com/docker/docker-credential-helpers` #549, 15,848 dependents (low confidence: credential helper protocol libs)
- `github.com/containernetworking/cni` #552, 15,794 dependents (low confidence: CNI container networking, not clear)
- `github.com/sagikazarmark/crypt` #559, 15,581 dependents (low confidence: remote config provider, no peers)
- `github.com/jinzhu/gorm` #560, 15,547 dependents (low confidence: ORM, no peers)
- `github.com/opencontainers/runtime-tools` #565, 15,361 dependents (low confidence: OCI runtime tooling)
- `github.com/gorilla/sessions` #569, 15,256 dependents (low confidence: session management, no peers)
- `github.com/shurcooL/httpfs` #570, 15,117 dependents (low confidence: http.FileSystem helpers)
- `gomodules.xyz/jsonpatch/v2` #575, 15,053 dependents
- `github.com/twitchyliquid64/golang-asm` #576, 14,862 dependents (low confidence: Go assembler fork)
- `github.com/cockroachdb/logtags` #577, 14,822 dependents (low confidence: context log tags)
- `github.com/cockroachdb/errors` #578, 14,822 dependents (low confidence: error library, no peers)
- `github.com/Masterminds/sprig` #581, 14,710 dependents (low confidence: template function map, not a template engine)
- `go.etcd.io/etcd/raft/v3` #591, 14,238 dependents (low confidence: Raft consensus, no peers)
- `github.com/otiai10/curr` #598, 14,079 dependents (low confidence: unknown small utility)
- `github.com/vektah/gqlparser` #612, 13,679 dependents (low confidence: GraphQL parser, no peers)
- `github.com/go-git/go-billy/v5` #616, 13,460 dependents (low confidence: filesystem abstraction)
- `github.com/d2g/dhcp4client` #625, 13,175 dependents (low confidence: DHCP client)
- `github.com/d2g/dhcp4` #626, 13,175 dependents (low confidence: DHCP protocol library)
- `github.com/peterh/liner` #627, 13,161 dependents (low confidence: line editor, no peers)
- `github.com/pkg/browser` #628, 13,135 dependents (low confidence: open browser helper)
- `github.com/dgryski/go-rendezvous` #631, 13,080 dependents (low confidence: rendezvous hashing, no peers)
- `golang.org/x/arch` #636, 12,717 dependents (low confidence: architecture disassemblers)
- `github.com/d2g/dhcp4server` #637, 12,691 dependents (low confidence: DHCP server library)
- `github.com/moby/locker` #639, 12,582 dependents (low confidence: keyed mutex locker)
- `github.com/containers/ocicrypt` #640, 12,575 dependents (low confidence: OCI image encryption)
- `github.com/d2g/hardwareaddr` #644, 12,492 dependents (low confidence: hardware address type)
- `github.com/moby/sys/symlink` #647, 12,238 dependents (low confidence: symlink resolution in scope)
- `github.com/nbutton23/zxcvbn-go` #648, 12,211 dependents (low confidence: password strength estimator)
- `github.com/containerd/imgcrypt` #650, 12,165 dependents (low confidence: image encryption)
- `github.com/containerd/nri` #654, 12,092 dependents (low confidence: node resource interface)
- `github.com/stefanberger/go-pkcs11uri` #655, 12,078 dependents (low confidence: PKCS#11 URI parser)
- `github.com/j-keck/arping` #658, 11,972 dependents (low confidence: ARP ping)
- `github.com/mitchellh/go-ps` #659, 11,931 dependents (low confidence: process listing)
- `github.com/google/go-containerregistry` #663, 11,790 dependents (low confidence: container registry client, no peers)
- `go.starlark.net` #672, 11,302 dependents (low confidence: Starlark interpreter, no peers)
- `github.com/yudai/gojsondiff` #676, 11,120 dependents (low confidence: structured JSON diff; excluded from text-diff)
- `github.com/boombuler/barcode` #677, 11,067 dependents (low confidence: barcode generation)
- `github.com/sourcegraph/go-diff` #705, 10,335 dependents (low confidence: Parses unified diff files rather than computing diffs; no matching category)
- `github.com/patrickmn/go-cache` #720, 10,239 dependents (low confidence: TTL in-memory cache without LRU bound; no peers)
- `github.com/zclconf/go-cty` #734, 9,832 dependents (low confidence: Config type system (cty); no peers)
- `github.com/ProtonMail/go-crypto` #736, 9,820 dependents (low confidence: OpenPGP/crypto fork spanning many tasks; no single category)
- `github.com/juju/ratelimit` #738, 9,793 dependents
- `github.com/agext/levenshtein` #739, 9,736 dependents
- `github.com/btcsuite/go-socks` #744, 9,527 dependents (low confidence: SOCKS proxy client; no category)
- `github.com/hailocab/go-hostpool` #748, 9,485 dependents (low confidence: Host pool selection for load balancing; no category)
- `github.com/kkdai/bstream` #756, 9,377 dependents (low confidence: Bit stream reader/writer; no category)
- `gopkg.in/src-d/go-billy.v4` #757, 9,358 dependents (low confidence: Filesystem abstraction (billy); no category)
- `github.com/kelseyhightower/envconfig` #760, 9,196 dependents (low confidence: Decodes env vars into structs; excluded from dotenv and no match)
- `github.com/bitly/go-hostpool` #762, 9,164 dependents (low confidence: Host pool selection; no category)
- `github.com/bradfitz/gomemcache` #763, 9,137 dependents (low confidence: Memcached client; no category)
- `github.com/cheggaaa/pb` #765, 9,124 dependents
- `github.com/eclipse/paho.mqtt.golang` #767, 9,111 dependents (low confidence: MQTT client; no category)
- `github.com/apparentlymart/go-textseg` #773, 9,013 dependents (low confidence: Unicode text segmentation; no category)
- `github.com/bradfitz/go-smtpd` #778, 8,887 dependents (low confidence: SMTP server library; no category)
- `grpc.go4.org` #779, 8,885 dependents (low confidence: gRPC implementation; no category)
- `github.com/jellevandenhooff/dkim` #781, 8,855 dependents (low confidence: DKIM verification; no category)
- `github.com/gocql/gocql` #784, 8,661 dependents
- `github.com/robfig/cron/v3` #785, 8,632 dependents
- `github.com/Nvveen/Gotty` #786, 8,611 dependents (low confidence: terminfo parser)
- `github.com/jackpal/go-nat-pmp` #789, 8,576 dependents (low confidence: NAT-PMP client; no category)
- `github.com/go-xmlfmt/xmlfmt` #797, 8,395 dependents (low confidence: XML formatter; no category)
- `github.com/huin/goupnp` #806, 8,310 dependents
- `github.com/lunixbochs/vtclean` #815, 8,228 dependents (low confidence: strips terminal escape codes; no peer)
- `github.com/AndreasBriese/bbloom` #817, 8,226 dependents
- `github.com/lucas-clemente/quic-go` #818, 8,222 dependents
- `github.com/phayes/checkstyle` #821, 8,202 dependents (low confidence: checkstyle XML file format; no peers)
- `github.com/sourcegraph/annotate` #827, 8,031 dependents (low confidence: source text annotation for highlighting; no peers)
- `github.com/sourcegraph/syntaxhighlight` #828, 8,028 dependents
- `github.com/google/cel-go` #829, 7,971 dependents (low confidence: CEL expression language; unrecognized fit)
- `gopkg.in/src-d/go-git.v4` #830, 7,932 dependents
- `github.com/segmentio/kafka-go` #836, 7,788 dependents
- `github.com/sclevine/agouti` #837, 7,748 dependents
- `github.com/bgentry/go-netrc` #838, 7,744 dependents (low confidence: netrc file parser; no peers)
- `github.com/aokoli/goutils` #840, 7,719 dependents (low confidence: string utility functions)
- `github.com/monochromegane/go-gitignore` #842, 7,684 dependents
- `github.com/mitchellh/hashstructure` #843, 7,675 dependents (low confidence: hashes arbitrary Go values; unrecognized fit)
- `github.com/cznic/mathutil` #853, 7,348 dependents (low confidence: math utility functions)
- `sigs.k8s.io/kustomize/api` #854, 7,288 dependents (low confidence: dummy main for kustomize API release)
- `github.com/c-bata/go-prompt` #857, 7,202 dependents
- `github.com/ajg/form` #862, 7,108 dependents (low confidence: form-urlencoded encode/decode; no peers)
- `github.com/shurcooL/highlight_go` #866, 7,053 dependents
- `github.com/shurcooL/highlight_diff` #867, 7,051 dependents
- `github.com/hashicorp/go-safetemp` #869, 7,022 dependents (low confidence: temp directory helper)
- `github.com/fvbommel/sortorder` #872, 6,997 dependents
- `github.com/quasilyte/regex/syntax` #873, 6,992 dependents (low confidence: regex syntax parser only; excluded from regex-matching)
- `github.com/shurcooL/httpgzip` #877, 6,898 dependents
- `github.com/hashicorp/go-getter` #882, 6,872 dependents
- `github.com/jcmturner/gokrb5/v8` #883, 6,872 dependents
- `github.com/graph-gophers/graphql-go` #884, 6,867 dependents
- `github.com/rubiojr/go-vhd` #888, 6,830 dependents (low confidence: VHD disk image utility)
- `github.com/influxdata/line-protocol` #891, 6,769 dependents (low confidence: InfluxDB line protocol; no peers)
- `github.com/dop251/goja` #893, 6,737 dependents
- `github.com/gobuffalo/here` #896, 6,717 dependents (low confidence: Go module/build info helper)
- `github.com/tyler-smith/go-bip39` #897, 6,702 dependents
- `github.com/jcmturner/aescts/v2` #909, 6,575 dependents (low confidence: AES-CTS cipher mode, not AEAD)
- `github.com/jcmturner/dnsutils/v2` #910, 6,575 dependents (low confidence: DNS SRV lookup helpers)
- `sourcegraph.com/sourcegraph/go-diff` #912, 6,557 dependents (low confidence: unified diff parser, not a differ)
- `github.com/golang/geo` #919, 6,524 dependents
- `github.com/shurcooL/htmlg` #920, 6,523 dependents (low confidence: HTML node generation helpers)
- `github.com/shurcooL/webdavfs` #922, 6,518 dependents (low confidence: WebDAV filesystem adapter)
- `github.com/codegangsta/inject` #928, 6,513 dependents
- `github.com/shurcooL/httperror` #930, 6,512 dependents (low confidence: HTTP framework building blocks)
- `github.com/tomasen/realip` #941, 6,397 dependents (low confidence: client IP extraction from requests)
- `github.com/Masterminds/squirrel` #947, 6,317 dependents
- `github.com/fjl/memsize` #952, 6,243 dependents (low confidence: object graph size measurement)
- `github.com/go-ldap/ldap/v3` #964, 6,157 dependents
- `github.com/status-im/keycard-go` #971, 6,056 dependents (low confidence: keycard smartcard library)
- `github.com/apparentlymart/go-cidr` #973, 6,038 dependents
- `github.com/yuin/gopher-lua` #974, 6,030 dependents
- `gopkg.in/jcmturner/dnsutils.v1` #976, 6,012 dependents (low confidence: DNS helpers)
- `gopkg.in/jcmturner/aescts.v1` #977, 6,012 dependents (low confidence: AES-CTS cipher mode)
- `github.com/imkira/go-interpol` #994, 5,851 dependents (low confidence: named-parameter string interpolation)
- `github.com/Masterminds/vcs` #997, 5,816 dependents (low confidence: VCS abstraction)

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `google.golang.org/appengine` #22, 166,712 dependents
- `golang.org/x/oauth2` #24, 163,003 dependents
- `cloud.google.com/go` #29, 156,705 dependents
- `go.opencensus.io` #62, 120,507 dependents (low confidence: OpenCensus tracing/stats instrumentation)
- `google.golang.org/api` #65, 119,534 dependents
- `github.com/googleapis/gax-go/v2` #70, 113,308 dependents
- `cloud.google.com/go/datastore` #103, 101,611 dependents
- `cloud.google.com/go/bigquery` #105, 101,387 dependents
- `cloud.google.com/go/storage` #108, 100,575 dependents
- `cloud.google.com/go/pubsub` #109, 100,525 dependents
- `github.com/grpc-ecosystem/go-grpc-prometheus` #150, 75,909 dependents
- `github.com/grpc-ecosystem/go-grpc-middleware` #155, 74,483 dependents
- `github.com/aws/aws-sdk-go` #176, 69,623 dependents
- `github.com/hashicorp/consul/api` #183, 67,699 dependents
- `github.com/hashicorp/consul/sdk` #187, 66,830 dependents (low confidence: Consul SDK helper packages)
- `cloud.google.com/go/firestore` #204, 57,670 dependents
- `github.com/armon/consul-api` #209, 55,713 dependents
- `github.com/xordataexchange/crypt` #210, 55,652 dependents (low confidence: crypt config store for etcd/consul)
- `github.com/opentracing/opentracing-go` #211, 55,229 dependents
- `github.com/Azure/go-autorest/autorest/adal` #234, 47,290 dependents
- `github.com/bketelsen/crypt` #235, 47,290 dependents (low confidence: crypt config store)
- `github.com/Azure/go-autorest/tracing` #236, 47,251 dependents
- `github.com/Azure/go-autorest/logger` #237, 47,078 dependents
- `github.com/Azure/go-autorest/autorest/mocks` #238, 46,957 dependents (low confidence: test mocks for autorest)
- `github.com/Azure/go-autorest/autorest` #241, 46,721 dependents
- `k8s.io/apimachinery` #243, 46,460 dependents (low confidence: k8s apimachinery library)
- `k8s.io/kube-openapi` #248, 44,388 dependents (low confidence: OpenAPI helpers for k8s)
- `k8s.io/client-go` #249, 44,291 dependents
- `github.com/Azure/go-autorest` #277, 39,759 dependents
- `go.etcd.io/etcd/client/pkg/v3` #283, 38,407 dependents (low confidence: etcd client helpers)
- `github.com/coreos/go-etcd` #287, 37,087 dependents
- `go.etcd.io/etcd/client/v2` #294, 36,412 dependents
- `github.com/openzipkin/zipkin-go` #296, 36,131 dependents
- `github.com/aws/aws-sdk-go-v2` #317, 31,600 dependents
- `github.com/Azure/azure-sdk-for-go` #324, 30,537 dependents
- `github.com/coreos/go-oidc` #325, 30,481 dependents (low confidence: OIDC client logic; no matching category)
- `go.opentelemetry.io/otel` #332, 29,020 dependents
- `github.com/aws/aws-lambda-go` #355, 26,658 dependents (low confidence: AWS Lambda runtime; no description)
- `github.com/DataDog/datadog-go` #362, 25,584 dependents
- `go.opentelemetry.io/otel/trace` #366, 25,521 dependents
- `github.com/nats-io/jwt` #367, 25,517 dependents (low confidence: NATS-specific JWT claims; no description)
- `sigs.k8s.io/apiserver-network-proxy/konnectivity-client` #379, 24,421 dependents (low confidence: Kubernetes konnectivity client; no description)
- `github.com/opentracing/basictracer-go` #388, 23,370 dependents (low confidence: Tracing library; no description)
- `sourcegraph.com/sourcegraph/appdash` #396, 22,591 dependents
- `github.com/gophercloud/gophercloud` #400, 22,292 dependents
- `go.opentelemetry.io/otel/sdk` #409, 21,744 dependents
- `github.com/influxdata/influxdb1-client` #414, 21,569 dependents
- `gopkg.in/airbrake/gobrake.v2` #418, 21,278 dependents
- `go.opentelemetry.io/otel/metric` #426, 21,100 dependents
- `github.com/hudl/fargo` #437, 20,598 dependents
- `github.com/lightstep/lightstep-tracer-go` #438, 20,573 dependents
- `github.com/opentracing-contrib/go-observer` #440, 20,509 dependents (low confidence)
- `github.com/openzipkin-contrib/zipkin-go-opentracing` #444, 20,284 dependents
- `github.com/googleapis/google-cloud-go-testing` #447, 20,263 dependents
- `cloud.google.com/go/compute` #454, 19,950 dependents
- `github.com/google/go-github` #481, 18,641 dependents
- `go.opentelemetry.io/otel/oteltest` #494, 18,160 dependents
- `github.com/getsentry/raven-go` #527, 17,019 dependents
- `github.com/bugsnag/bugsnag-go` #534, 16,852 dependents
- `github.com/Azure/azure-pipeline-go` #536, 16,772 dependents
- `github.com/Azure/azure-storage-blob-go` #538, 16,688 dependents
- `github.com/aws/smithy-go` #540, 16,558 dependents
- `github.com/yvasiyarov/newrelic_platform_go` #541, 16,336 dependents
- `github.com/yvasiyarov/gorelic` #543, 16,327 dependents
- `github.com/ncw/swift` #545, 16,078 dependents
- `github.com/denverdino/aliyungo` #561, 15,530 dependents
- `go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp` #568, 15,269 dependents
- `google.golang.org/cloud` #571, 15,113 dependents
- `go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc` #572, 15,086 dependents
- `go.opentelemetry.io/otel/sdk/metric` #573, 15,074 dependents
- `github.com/Azure/go-autorest/autorest/azure/cli` #579, 14,741 dependents
- `github.com/aws/aws-sdk-go-v2/service/internal/presigned-url` #580, 14,738 dependents
- `github.com/aws/aws-sdk-go-v2/credentials` #582, 14,705 dependents
- `github.com/aws/aws-sdk-go-v2/service/sts` #583, 14,647 dependents
- `github.com/aws/aws-sdk-go-v2/feature/ec2/imds` #584, 14,603 dependents
- `go.opentelemetry.io/contrib` #585, 14,569 dependents
- `github.com/aws/aws-sdk-go-v2/service/sso` #587, 14,377 dependents
- `cloud.google.com/go/compute/metadata` #588, 14,375 dependents
- `github.com/aws/aws-sdk-go-v2/config` #589, 14,350 dependents
- `go.opentelemetry.io/otel/sdk/export/metric` #592, 14,235 dependents
- `github.com/Azure/go-autorest/autorest/azure/auth` #600, 14,046 dependents
- `cloud.google.com/go/iam` #603, 13,902 dependents
- `go.opentelemetry.io/otel/exporters/otlp` #610, 13,703 dependents
- `github.com/uber/jaeger-client-go` #642, 12,545 dependents
- `contrib.go.opencensus.io/exporter/stackdriver` #661, 11,869 dependents
- `github.com/uber/jaeger-lib` #666, 11,586 dependents
- `k8s.io/cli-runtime` #669, 11,364 dependents (low confidence: kubernetes CLI runtime)
- `github.com/xanzy/go-gitlab` #671, 11,320 dependents
- `contrib.go.opencensus.io/exporter/ocagent` #729, 10,015 dependents
- `cloud.google.com/go/spanner` #730, 9,985 dependents
- `github.com/vmware/govmomi` #733, 9,859 dependents
- `github.com/btcsuite/btcutil` #740, 9,684 dependents (low confidence: Bitcoin-specific helpers)
- `github.com/cloudflare/cloudflare-go` #780, 8,872 dependents
- `github.com/hashicorp/vault/api` #794, 8,444 dependents
- `github.com/hashicorp/vault/sdk` #796, 8,400 dependents
- `github.com/google/certificate-transparency-go` #814, 8,235 dependents (low confidence: Certificate Transparency types and client)
- `github.com/googleapis/enterprise-certificate-proxy` #822, 8,200 dependents (low confidence: Google enterprise certificate proxy client)
- `go.opentelemetry.io/otel/exporters/otlp/otlptrace` #832, 7,912 dependents
- `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` #847, 7,567 dependents
- `github.com/smartystreets/go-aws-auth` #855, 7,244 dependents
- `k8s.io/cloud-provider` #860, 7,158 dependents (low confidence: cloud provider interfaces for Kubernetes)
- `github.com/aws/aws-sdk-go-v2/internal/configsources` #861, 7,142 dependents
- `github.com/GoogleCloudPlatform/k8s-cloud-provider` #887, 6,845 dependents (low confidence: GCP cloud provider helper)
- `github.com/jcmturner/goidentity/v6` #890, 6,775 dependents (low confidence: Kerberos identity interface)
- `k8s.io/csi-translation-lib` #898, 6,700 dependents (low confidence: Kubernetes CSI translation)
- `cloud.google.com/go/secretmanager` #901, 6,647 dependents
- `github.com/devigned/tab` #902, 6,638 dependents (low confidence: tracing abstraction, unrecognized detail)
- `k8s.io/legacy-cloud-providers` #906, 6,609 dependents (low confidence: k8s cloud provider code)
- `cloud.google.com/go/kms` #907, 6,592 dependents
- `github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding` #911, 6,574 dependents
- `github.com/aws/aws-sdk-go-v2/internal/endpoints/v2` #936, 6,439 dependents
- `github.com/aliyun/alibaba-cloud-sdk-go` #948, 6,313 dependents
- `github.com/aws/aws-sdk-go-v2/service/internal/s3shared` #957, 6,221 dependents
- `github.com/aws/aws-sdk-go-v2/service/s3` #961, 6,207 dependents
- `github.com/aliyun/aliyun-oss-go-sdk` #963, 6,198 dependents
- `cloud.google.com/go/bigtable` #982, 5,975 dependents
- `github.com/Azure/azure-sdk-for-go/sdk/azcore` #984, 5,959 dependents
- `github.com/Azure/azure-sdk-for-go/sdk/internal` #985, 5,951 dependents
- `contrib.go.opencensus.io/integrations/ocsql` #999, 5,813 dependents (low confidence: opencensus instrumentation)

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `github.com/stretchr/testify` #5, 280,136 dependents
- `gopkg.in/check.v1` #7, 273,224 dependents
- `golang.org/x/tools` #10, 248,775 dependents
- `golang.org/x/lint` #23, 164,588 dependents
- `golang.org/x/mod` #26, 159,866 dependents (low confidence: go.mod/semver module tooling used by go command)
- `honnef.co/go/tools` #27, 159,437 dependents
- `github.com/golang/mock` #32, 154,196 dependents
- `github.com/client9/misspell` #36, 149,121 dependents
- `github.com/rogpeppe/go-internal` #38, 145,028 dependents (low confidence: testscript and internal utilities for tooling)
- `github.com/kisielk/gotool` #39, 143,885 dependents
- `golang.org/x/mobile` #78, 108,792 dependents (low confidence: mobile build/bind tooling)
- `github.com/kisielk/errcheck` #85, 106,946 dependents
- `github.com/onsi/gomega` #93, 103,872 dependents
- `github.com/onsi/ginkgo` #98, 102,309 dependents
- `github.com/chzyer/test` #123, 96,199 dependents (low confidence: test helper)
- `github.com/gopherjs/gopherjs` #136, 85,458 dependents
- `github.com/smartystreets/assertions` #140, 84,193 dependents
- `github.com/smartystreets/goconvey` #141, 82,863 dependents
- `github.com/mitchellh/go-testing-interface` #157, 74,278 dependents (low confidence: testing interface shim)
- `github.com/mitchellh/gox` #203, 58,051 dependents
- `github.com/go-playground/assert/v2` #226, 51,279 dependents
- `go.uber.org/tools` #228, 49,593 dependents
- `github.com/cockroachdb/datadriven` #257, 42,706 dependents
- `go.uber.org/goleak` #258, 42,603 dependents
- `github.com/jmespath/go-jmespath/internal/testify` #265, 41,730 dependents
- `github.com/frankban/quicktest` #271, 40,418 dependents
- `gotest.tools` #288, 37,058 dependents
- `github.com/dnaeon/go-vcr` #345, 27,654 dependents (low confidence: HTTP record/replay for tests; no description)
- `github.com/bmizerany/assert` #381, 23,942 dependents (low confidence: Test assertion helper; no description)
- `github.com/gobuffalo/packr/v2` #387, 23,693 dependents (low confidence: Static asset embedding tool)
- `gopkg.in/go-playground/assert.v1` #407, 21,785 dependents
- `github.com/fortytw2/leaktest` #429, 21,058 dependents
- `github.com/franela/goblin` #433, 20,823 dependents
- `github.com/pact-foundation/pact-go` #457, 19,894 dependents
- `github.com/DATA-DOG/go-sqlmock` #463, 19,494 dependents
- `github.com/golangci/lint-1` #551, 15,794 dependents
- `github.com/otiai10/mint` #595, 14,188 dependents
- `github.com/matryer/is` #599, 14,076 dependents
- `github.com/golang/lint` #641, 12,559 dependents
- `github.com/Microsoft/hcsshim/test` #656, 12,008 dependents (low confidence: test package)
- `github.com/sclevine/spec` #662, 11,850 dependents
- `github.com/maxbrunsfeld/counterfeiter/v6` #668, 11,365 dependents
- `mvdan.cc/unparam` #684, 10,613 dependents
- `modernc.org/cc` #687, 10,540 dependents (low confidence: C99 compiler front end)
- `github.com/golangci/misspell` #691, 10,476 dependents
- `mvdan.cc/lint` #693, 10,455 dependents
- `mvdan.cc/interfacer` #694, 10,449 dependents
- `github.com/joefitzgerald/rainbow-reporter` #696, 10,417 dependents
- `github.com/golangci/golangci-lint` #697, 10,411 dependents
- `github.com/golangci/gofmt` #698, 10,407 dependents
- `github.com/go-critic/go-critic` #701, 10,356 dependents
- `github.com/golangci/revgrep` #704, 10,339 dependents
- `github.com/golangci/unconvert` #706, 10,335 dependents
- `github.com/golangci/go-misc` #707, 10,333 dependents (low confidence: Unrecognized golangci fork; likely a Go lint helper)
- `github.com/golangci/check` #708, 10,332 dependents (low confidence: Unrecognized golangci fork; likely Go checking tool)
- `github.com/OpenPeeDeeP/depguard` #709, 10,332 dependents
- `github.com/golangci/maligned` #710, 10,331 dependents
- `github.com/golangci/dupl` #711, 10,329 dependents
- `github.com/timakin/bodyclose` #713, 10,310 dependents
- `github.com/ultraware/funlen` #726, 10,111 dependents
- `github.com/erikstmartin/go-testdb` #732, 9,882 dependents (low confidence: Mock SQL driver for tests)
- `github.com/gordonklaus/ineffassign` #735, 9,825 dependents
- `github.com/golangplus/testing` #743, 9,597 dependents (low confidence: Test helper utilities)
- `golang.org/x/perf` #759, 9,205 dependents
- `github.com/matoous/godox` #764, 9,125 dependents
- `github.com/ultraware/whitespace` #766, 9,122 dependents
- `github.com/uudashr/gocognit` #768, 9,103 dependents
- `github.com/nishanths/predeclared` #772, 9,054 dependents
- `github.com/jingyugao/rowserrcheck` #788, 8,580 dependents
- `github.com/jirfag/go-printf-func-name` #791, 8,514 dependents
- `mvdan.cc/gofumpt` #799, 8,362 dependents
- `github.com/tetafro/godot` #800, 8,339 dependents
- `github.com/bombsimon/wsl/v3` #801, 8,339 dependents
- `github.com/maratori/testpackage` #802, 8,338 dependents
- `github.com/nakabonne/nestif` #803, 8,335 dependents
- `github.com/ryancurrah/gomodguard` #804, 8,335 dependents
- `github.com/tdakkota/asciicheck` #805, 8,316 dependents
- `github.com/quasilyte/go-consistent` #810, 8,281 dependents
- `github.com/mschoch/smat` #812, 8,269 dependents (low confidence: state-machine-assisted fuzz testing helper; unrecognized)
- `github.com/securego/gosec/v2` #819, 8,210 dependents
- `github.com/Djarvur/go-err113` #820, 8,206 dependents
- `github.com/quasilyte/go-ruleguard` #824, 8,092 dependents
- `github.com/jarcoal/httpmock` #839, 7,724 dependents (low confidence: HTTP mocking for tests)
- `github.com/google/wire` #841, 7,687 dependents
- `github.com/glycerine/goconvey` #851, 7,419 dependents
- `github.com/nishanths/exhaustive` #868, 7,032 dependents
- `github.com/kyoh86/exportloopref` #871, 7,008 dependents
- `github.com/go-check/check` #874, 6,939 dependents
- `github.com/sonatard/noctx` #875, 6,934 dependents
- `github.com/ryanrolds/sqlclosecheck` #876, 6,933 dependents
- `github.com/smartystreets/gunit` #886, 6,850 dependents
- `github.com/daixiang0/gci` #892, 6,765 dependents
- `github.com/ssgreg/nlreturn/v2` #905, 6,613 dependents
- `sigs.k8s.io/controller-tools` #908, 6,580 dependents
- `github.com/shurcooL/gopherjslib` #929, 6,513 dependents
- `github.com/fzipp/gocyclo` #938, 6,416 dependents
- `github.com/mgechev/revive` #939, 6,414 dependents
- `github.com/modocache/gover` #944, 6,361 dependents
- `4d63.com/gochecknoglobals` #951, 6,263 dependents
- `github.com/mwitkow/go-proto-validators` #953, 6,243 dependents (low confidence: protobuf validator generator)
- `github.com/jgautheron/goconst` #954, 6,242 dependents
- `github.com/polyfloyd/go-errorlint` #958, 6,217 dependents
- `github.com/nbio/st` #959, 6,216 dependents
- `github.com/moricho/tparallel` #960, 6,209 dependents
- `github.com/markbates/pkger` #968, 6,091 dependents
- `github.com/kunwardeep/paralleltest` #972, 6,053 dependents
- `github.com/mbilski/exhaustivestruct` #975, 6,013 dependents
- `github.com/ashanbrown/makezero` #978, 6,006 dependents
- `github.com/pseudomuto/protokit` #979, 5,994 dependents
- `github.com/pseudomuto/protoc-gen-doc` #981, 5,989 dependents
- `github.com/ashanbrown/forbidigo` #988, 5,931 dependents
- `github.com/kulti/thelper` #989, 5,930 dependents
- `github.com/quasilyte/go-ruleguard/dsl` #991, 5,913 dependents
- `github.com/esimonov/ifshort` #995, 5,837 dependents
- `github.com/charithe/durationcheck` #996, 5,826 dependents
- `github.com/tommy-muehle/go-mnd/v2` #998, 5,815 dependents

## System and foreign bindings

Bindings to operating system APIs, C libraries and other language runtimes, whose work is done by the code they wrap; prebuilt per-platform import libraries are out of scope.

- `golang.org/x/sys` #1, 298,851 dependents
- `github.com/kr/pty` #18, 195,811 dependents
- `github.com/konsorten/go-windows-terminal-sequences` #50, 131,583 dependents (low confidence: windows terminal escape sequence enabling)
- `github.com/jstemmer/go-junit-report` #73, 111,360 dependents
- `github.com/prometheus/procfs` #76, 109,403 dependents
- `github.com/BurntSushi/xgb` #77, 109,272 dependents
- `dmitri.shuralyov.com/gpu/mtl` #95, 102,955 dependents
- `github.com/go-gl/glfw` #112, 99,315 dependents
- `github.com/go-gl/glfw/v3.3/glfw` #127, 92,481 dependents
- `github.com/coreos/go-systemd` #131, 88,512 dependents
- `github.com/mattn/go-sqlite3` #188, 63,599 dependents
- `github.com/godbus/dbus/v5` #215, 54,001 dependents
- `github.com/Microsoft/go-winio` #255, 43,672 dependents
- `github.com/edsrzf/mmap-go` #316, 31,852 dependents
- `github.com/go-ole/go-ole` #337, 28,773 dependents
- `github.com/containerd/console` #373, 24,930 dependents (low confidence: Terminal console handling for containerd)
- `gonum.org/v1/netlib` #376, 24,659 dependents
- `github.com/StackExchange/wmi` #391, 23,070 dependents
- `bazil.org/fuse` #392, 22,895 dependents
- `github.com/Microsoft/hcsshim` #395, 22,630 dependents
- `github.com/vishvananda/netlink` #397, 22,508 dependents
- `github.com/vishvananda/netns` #404, 21,989 dependents
- `github.com/containerd/cgroups` #411, 21,656 dependents
- `github.com/syndtr/gocapability` #416, 21,426 dependents
- `github.com/cilium/ebpf` #432, 21,038 dependents
- `github.com/containerd/fifo` #445, 20,277 dependents
- `github.com/containerd/go-runc` #459, 19,873 dependents
- `github.com/opencontainers/selinux` #479, 18,863 dependents
- `github.com/seccomp/libseccomp-golang` #480, 18,773 dependents
- `github.com/moby/sys/mountinfo` #496, 18,076 dependents (low confidence: Mount info retrieval)
- `github.com/miekg/pkcs11` #529, 16,979 dependents
- `github.com/mistifyio/go-zfs` #555, 15,749 dependents
- `github.com/checkpoint-restore/go-criu/v5` #594, 14,198 dependents
- `github.com/coreos/go-iptables` #611, 13,683 dependents
- `github.com/safchain/ethtool` #630, 13,086 dependents
- `github.com/containerd/go-cni` #643, 12,493 dependents (low confidence: CNI bindings)
- `github.com/containerd/btrfs` #649, 12,166 dependents
- `github.com/containerd/zfs` #652, 12,114 dependents
- `github.com/containerd/aufs` #653, 12,114 dependents
- `github.com/tarm/serial` #747, 9,494 dependents
- `github.com/btcsuite/winsvc` #751, 9,464 dependents
- `github.com/mattn/go-tty` #771, 9,058 dependents (low confidence: TTY access)
- `github.com/danieljoos/wincred` #798, 8,387 dependents
- `github.com/shirou/w32` #816, 8,227 dependents
- `github.com/pkg/term` #825, 8,061 dependents
- `gopkg.in/natefinch/npipe.v2` #865, 7,060 dependents
- `github.com/gballet/go-libpcsclite` #970, 6,057 dependents (low confidence: smartcard bindings)

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `github.com/modern-go/concurrent` #41, 142,786 dependents (low confidence: concurrency helpers internal to json-iterator)
- `github.com/modern-go/reflect2` #42, 142,780 dependents
- `github.com/prometheus/common` #84, 106,982 dependents (low confidence: shared helper code for Prometheus libraries)
- `github.com/matttproud/golang_protobuf_extensions` #88, 105,944 dependents (low confidence: protobuf extension helpers for Prometheus)
- `github.com/go-openapi/swag` #205, 57,395 dependents (low confidence: helper grab-bag for go-openapi)
- `github.com/opencontainers/go-digest` #285, 37,365 dependents (low confidence: digest type)
- `k8s.io/component-base` #328, 30,198 dependents (low confidence: Shared Kubernetes component helpers)
- `github.com/gobuffalo/packd` #383, 23,922 dependents (low confidence: Buffalo packaging interfaces; no description)
- `github.com/containerd/typeurl` #419, 21,277 dependents (low confidence)
- `github.com/go-openapi/errors` #473, 19,073 dependents (low confidence: go-openapi sub-package)
- `github.com/go-openapi/strfmt` #476, 19,012 dependents (low confidence: go-openapi sub-package)
- `github.com/jackc/pgio` #489, 18,202 dependents
- `github.com/jackc/pgproto3/v2` #490, 18,200 dependents (low confidence: PG wire protocol codec, part of pgx)
- `github.com/jackc/chunkreader/v2` #492, 18,188 dependents
- `github.com/jackc/pgtype` #493, 18,186 dependents
- `github.com/go-openapi/loads` #497, 18,066 dependents (low confidence: go-openapi sub-package)
- `github.com/go-openapi/analysis` #498, 18,047 dependents (low confidence: go-openapi sub-package)
- `github.com/gobuffalo/genny` #501, 17,990 dependents (low confidence: buffalo generator framework piece)
- `github.com/go-openapi/runtime` #508, 17,717 dependents (low confidence: go-openapi toolkit runtime piece)
- `github.com/gobuffalo/syncx` #510, 17,619 dependents (low confidence: buffalo sub-package)
- `github.com/gobuffalo/mapi` #511, 17,618 dependents (low confidence: buffalo sub-package)
- `github.com/gobuffalo/gogen` #513, 17,385 dependents (low confidence: buffalo sub-package)
- `github.com/gobuffalo/attrs` #514, 17,379 dependents (low confidence: buffalo sub-package)
- `github.com/gobuffalo/gitgen` #516, 17,317 dependents (low confidence: buffalo sub-package)
- `github.com/gobuffalo/depgen` #524, 17,040 dependents (low confidence: buffalo sub-package)
- `go.etcd.io/etcd/pkg/v3` #590, 14,340 dependents (low confidence: etcd utility packages)
- `github.com/gobwas/pool` #605, 13,838 dependents (low confidence: size-based pooling helper)
- `github.com/gobwas/httphead` #606, 13,829 dependents (low confidence: header parsing helper for gobwas/ws)
- `github.com/philhofer/fwd` #645, 12,369 dependents (low confidence: buffered reader/writer for msgp)
- `github.com/vmihailenco/tagparser` #674, 11,236 dependents
- `github.com/jcmturner/gofork` #678, 11,047 dependents (low confidence: forked stdlib pieces)
- `github.com/pelletier/go-buffruneio` #793, 8,477 dependents
- `gopkg.in/src-d/go-git-fixtures.v3` #850, 7,486 dependents (low confidence: test fixtures for go-git)
- `github.com/huin/goutil` #856, 7,241 dependents (low confidence: unrecognized; no description)
- `dmitri.shuralyov.com/state` #917, 6,525 dependents (low confidence: domain state types)
- `k8s.io/component-helpers` #946, 6,331 dependents (low confidence: k8s component helpers)
- `github.com/zclconf/go-cty-debug` #987, 5,948 dependents (low confidence: cty debug helpers)

## Applications and daemons

Complete servers, daemons, command-line programs and websites that happen to be published as importable packages and are run rather than called for one task; build, lint and test tools and reusable frameworks are out of scope.

- `github.com/google/pprof` #69, 116,537 dependents (low confidence: pprof is a CLI tool/library for profile visualization)
- `github.com/google/martian` #71, 112,722 dependents (low confidence: HTTP proxy library, run as a proxy)
- `github.com/creack/pty` #72, 112,125 dependents
- `github.com/coreos/etcd` #154, 74,923 dependents
- `github.com/hashicorp/serf` #181, 68,846 dependents (low confidence: distributed service discovery daemon with library)
- `github.com/docker/docker` #275, 40,103 dependents
- `go.etcd.io/etcd` #279, 39,452 dependents
- `github.com/Shopify/toxiproxy` #305, 33,999 dependents (low confidence: Chaos-testing TCP proxy daemon, no description)
- `github.com/docker/distribution` #306, 33,614 dependents (low confidence: Docker registry; description only mentions interfaces)
- `github.com/opencontainers/runc` #352, 27,022 dependents
- `github.com/containerd/containerd` #358, 26,380 dependents
- `github.com/nats-io/nats-server/v2` #374, 24,884 dependents
- `k8s.io/kubernetes` #442, 20,364 dependents
- `github.com/oklog/oklog` #458, 19,873 dependents (low confidence)
- `github.com/docker/cli` #539, 16,666 dependents
- `go.etcd.io/etcd/server/v3` #596, 14,163 dependents
- `github.com/mattn/goveralls` #615, 13,472 dependents
- `github.com/containernetworking/plugins` #629, 13,106 dependents (low confidence: CNI plugin binaries)
- `github.com/influxdata/influxdb` #680, 10,935 dependents
- `github.com/btcsuite/btcd` #689, 10,491 dependents
- `github.com/mozilla/tls-observatory` #723, 10,198 dependents (low confidence: Unrecognized; likely a TLS scanning service)
- `k8s.io/kubectl` #728, 10,021 dependents (low confidence: kubectl CLI published as importable packages)
- `github.com/jrick/logrotate` #746, 9,497 dependents
- `golang.org/x/build` #774, 9,008 dependents (low confidence: Go build infrastructure)
- `github.com/ethereum/go-ethereum` #881, 6,875 dependents
- `dmitri.shuralyov.com/app/changes` #916, 6,528 dependents
- `github.com/shurcooL/issuesapp` #924, 6,515 dependents
- `github.com/shurcooL/home` #927, 6,514 dependents
- `k8s.io/kube-aggregator` #933, 6,504 dependents (low confidence)
- `github.com/fsouza/fake-gcs-server` #940, 6,401 dependents (low confidence: fake GCS server)
- `github.com/GoogleCloudPlatform/cloudsql-proxy` #945, 6,356 dependents
- `github.com/fullstorydev/grpcurl` #966, 6,135 dependents (low confidence: grpcurl CLI core)

## Generated API and schema types

Packages that consist of message, resource and specification types, mostly generated from Protocol Buffers, OpenAPI or other interface definitions, with no behavior beyond field access and serialization glue; the serialization runtimes and the clients that use the types are out of scope.

- `google.golang.org/genproto` #31, 155,701 dependents
- `github.com/prometheus/client_model` #33, 153,512 dependents
- `github.com/census-instrumentation/opencensus-proto` #54, 126,032 dependents
- `github.com/envoyproxy/go-control-plane` #58, 124,048 dependents
- `github.com/cncf/udpa/go` #96, 102,740 dependents (low confidence: udpa xDS protobuf types)
- `go.opentelemetry.io/proto/otlp` #214, 54,680 dependents
- `github.com/cncf/xds/go` #217, 53,305 dependents
- `k8s.io/api` #244, 44,952 dependents
- `github.com/go-openapi/spec` #254, 43,720 dependents (low confidence: OpenAPI spec object model)
- `github.com/googleapis/gnostic` #268, 40,732 dependents (low confidence: OpenAPI tooling and types)
- `go.etcd.io/etcd/api/v3` #282, 38,750 dependents
- `github.com/opencontainers/image-spec` #302, 34,287 dependents
- `github.com/gogo/googleapis` #318, 31,316 dependents
- `github.com/opencontainers/runtime-spec` #378, 24,562 dependents
- `k8s.io/apiextensions-apiserver` #430, 21,055 dependents (low confidence)
- `github.com/lightstep/lightstep-tracer-common/golang/gogo` #446, 20,275 dependents
- `k8s.io/cri-api` #567, 15,309 dependents
- `github.com/google/gnostic` #683, 10,641 dependents (low confidence: OpenAPI tooling/types)
- `sourcegraph.com/sqs/pbtypes` #688, 10,509 dependents
- `k8s.io/metrics` #724, 10,191 dependents
- `github.com/googleapis/go-type-adapters` #859, 7,163 dependents
- `github.com/google/cel-spec` #903, 6,622 dependents (low confidence: CEL spec protos)
- `dmitri.shuralyov.com/service/change` #915, 6,528 dependents (low confidence: service definition interfaces)
- `github.com/shurcooL/issues` #923, 6,515 dependents (low confidence: service definition)
- `github.com/shurcooL/notifications` #925, 6,515 dependents (low confidence: service definition)
- `github.com/shurcooL/reactions` #926, 6,515 dependents (low confidence: service definition)
- `github.com/shurcooL/users` #931, 6,512 dependents (low confidence: service definition)
- `github.com/shurcooL/events` #932, 6,512 dependents (low confidence: service definition)
- `github.com/google/trillian` #1000, 5,812 dependents

## Structured logging

Application loggers that format records with levels and key-value fields, as JSON or colored text, and write them to a sink; environment-switched debug loggers, telemetry exporters and vendor log shippers are out of scope.

- `github.com/golang/glog` #30, 156,106 dependents
- `github.com/sirupsen/logrus` #34, 153,056 dependents
- `go.uber.org/zap` #68, 116,868 dependents
- `github.com/spf13/jwalterweatherman` #118, 97,273 dependents (low confidence: leveled logging notepad)
- `github.com/chzyer/logex` #124, 96,197 dependents (low confidence: small logging helper)
- `github.com/hashicorp/logutils` #169, 71,277 dependents (low confidence: leveled log filter)
- `github.com/go-logr/logr` #227, 50,012 dependents (low confidence: logging API facade)
- `github.com/go-kit/log` #240, 46,895 dependents
- `github.com/hashicorp/go-hclog` #272, 40,335 dependents
- `k8s.io/klog/v2` #292, 36,663 dependents
- `github.com/rs/zerolog` #311, 32,224 dependents
- `github.com/op/go-logging` #371, 25,213 dependents
- `github.com/gobuffalo/logger` #385, 23,862 dependents (low confidence: Buffalo logger; no description)
- `gopkg.in/inconshreveable/log15.v2` #495, 18,091 dependents
- `github.com/go-logr/zapr` #509, 17,692 dependents (low confidence: logr adapter over zap)
- `github.com/btcsuite/btclog` #745, 9,501 dependents
- `github.com/go-logr/stdr` #776, 8,921 dependents
- `github.com/Sirupsen/logrus` #955, 6,233 dependents

## Language-level abstractions

Trait definitions, declarative macros, error types, lazy statics, marker and wrapper types that shape code at compile time and have no standalone runtime task.

- `golang.org/x/xerrors` #14, 206,048 dependents
- `github.com/pkg/errors` #17, 198,114 dependents
- `gopkg.in/errgo.v2` #44, 141,521 dependents (low confidence: error wrapping utilities)
- `go.uber.org/atomic` #60, 121,018 dependents
- `github.com/go-stack/stack` #63, 120,231 dependents (low confidence: call stack capture helper)
- `go.uber.org/multierr` #66, 117,290 dependents
- `github.com/hashicorp/go-multierror` #134, 85,818 dependents
- `github.com/hashicorp/errwrap` #135, 85,778 dependents
- `github.com/antihax/optional` #179, 69,036 dependents (low confidence: optional-value types for generated API clients)
- `gopkg.in/warnings.v0` #267, 40,961 dependents (low confidence: warnings error type)
- `github.com/go-errors/errors` #390, 23,102 dependents
- `github.com/Azure/go-autorest/autorest/to` #436, 20,675 dependents
- `github.com/markbates/oncer` #452, 20,039 dependents (low confidence)
- `github.com/markbates/safe` #453, 19,992 dependents (low confidence)
- `github.com/jbenet/go-context` #466, 19,325 dependents (low confidence)
- `github.com/lann/builder` #943, 6,364 dependents (low confidence: fluent immutable builder helper)
- `github.com/facebookgo/stack` #949, 6,281 dependents (low confidence: stack trace utilities)

## Environment detection

One-shot probes of the host such as CPU count and features, terminal state, user, host name, time zone and standard directories, which return in constant time and have no workload to scale.

- `github.com/mattn/go-isatty` #21, 167,492 dependents
- `golang.org/x/term` #25, 160,030 dependents (low confidence: terminal helpers (raw mode, size, isatty) plus password reading)
- `github.com/inconshreveable/mousetrap` #82, 107,481 dependents (low confidence: Windows explorer launch detection)
- `github.com/mitchellh/go-homedir` #89, 105,050 dependents
- `github.com/moby/term` #343, 27,845 dependents
- `github.com/klauspost/cpuid` #377, 24,625 dependents
- `github.com/shirou/gopsutil` #470, 19,147 dependents (low confidence: System stats probes; no workload to scale)
- `github.com/bugsnag/osext` #548, 15,888 dependents (low confidence: executable path lookup)
- `github.com/mattn/go-ieproxy` #553, 15,787 dependents
- `github.com/tklauser/go-sysconf` #562, 15,519 dependents
- `github.com/tklauser/numcpus` #563, 15,502 dependents
- `github.com/mitchellh/osext` #614, 13,478 dependents
- `github.com/kardianos/osext` #660, 11,898 dependents
- `github.com/phayes/freeport` #831, 7,920 dependents
- `go.uber.org/automaxprocs` #852, 7,373 dependents
- `github.com/xo/terminfo` #942, 6,374 dependents (low confidence: terminfo reader)
- `github.com/lufia/plan9stats` #990, 5,930 dependents

## Tooling internals (AST and code utilities)

Building blocks used inside compilers and linters, such as AST node helpers, traversal, scope analysis, tokenizing and code frames; standalone parsers are out of scope.

- `modernc.org/xc` #685, 10,548 dependents (low confidence: C compiler support)
- `github.com/gostaticanalysis/analysisutil` #700, 10,372 dependents
- `github.com/go-toolsmith/astequal` #702, 10,346 dependents
- `github.com/go-toolsmith/strparse` #703, 10,344 dependents
- `github.com/go-toolsmith/astcopy` #712, 10,324 dependents
- `github.com/go-toolsmith/typep` #714, 10,309 dependents
- `github.com/go-toolsmith/astcast` #715, 10,306 dependents
- `github.com/go-toolsmith/astfmt` #716, 10,300 dependents
- `github.com/go-toolsmith/astp` #717, 10,299 dependents
- `github.com/go-toolsmith/pkgload` #719, 10,284 dependents
- `github.com/fatih/structtag` #742, 9,626 dependents (low confidence: Parses Go struct tags; AST-adjacent helper)
- `github.com/go-toolsmith/astinfo` #811, 8,270 dependents
- `github.com/neelance/astrewrite` #833, 7,887 dependents
- `github.com/gostaticanalysis/comment` #937, 6,435 dependents

## Framework and tool extensions

Plugins, engines, adapters, middleware and asset bundles that only work inside one host framework or tool, such as Rails engines, Rack middleware, OmniAuth strategies, Faraday adapters and Fluentd or Logstash plugins; the host frameworks themselves and build or test tooling plugins are out of scope.

- `github.com/gin-contrib/sse` #216, 53,432 dependents (low confidence: SSE helper for gin)
- `github.com/NYTimes/gziphandler` #264, 41,761 dependents
- `github.com/gorilla/handlers` #321, 30,713 dependents (low confidence: net/http middleware collection)
- `github.com/rs/cors` #351, 27,043 dependents (low confidence: CORS net/http middleware)
- `github.com/felixge/httpsnoop` #380, 24,166 dependents (low confidence: net/http response wrapper for metrics)
- `gopkg.in/gemnasium/logrus-airbrake-hook.v2` #420, 21,272 dependents
- `github.com/streadway/handy` #441, 20,493 dependents (low confidence: HTTP handler filters; single-purpose middleware)
- `github.com/bshuster-repo/logrus-logstash-hook` #547, 15,896 dependents
- `github.com/Shopify/logrus-bugsnag` #554, 15,774 dependents
- `gorm.io/driver/postgres` #783, 8,750 dependents
- `gorm.io/driver/mysql` #795, 8,428 dependents
- `github.com/elazarl/go-bindata-assetfs` #807, 8,291 dependents (low confidence: adapter serving go-bindata assets via net/http)
- `github.com/gin-contrib/cors` #980, 5,989 dependents
- `github.com/jsternberg/zap-logfmt` #993, 5,861 dependents (low confidence: zap logfmt encoder)

## Binary serialization

Encode structured values to a compact binary format and decode them back, such as Protocol Buffers, MessagePack, CBOR and bincode; text formats, columnar data and byte-order helpers are out of scope.

- `github.com/golang/protobuf` #13, 213,436 dependents
- `google.golang.org/protobuf` #37, 148,671 dependents
- `github.com/gogo/protobuf` #55, 125,927 dependents
- `github.com/ugorji/go` #138, 84,744 dependents
- `github.com/ugorji/go/codec` #142, 82,619 dependents
- `github.com/hashicorp/go-msgpack` #174, 69,918 dependents
- `github.com/apache/thrift` #314, 31,925 dependents (low confidence: Thrift serialization plus RPC)
- `github.com/jhump/protoreflect` #523, 17,087 dependents (low confidence: protobuf reflection library)
- `github.com/google/flatbuffers` #621, 13,376 dependents
- `github.com/tinylib/msgp` #646, 12,247 dependents
- `github.com/vmihailenco/msgpack` #679, 10,944 dependents
- `git.apache.org/thrift.git` #727, 10,060 dependents (low confidence: Thrift is serialization plus RPC framework; approximate fit)
- `github.com/jcmturner/rpc/v2` #880, 6,887 dependents (low confidence: MS-RPC NDR encoding; unrecognized)

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `golang.org/x/text` #4, 280,468 dependents (low confidence: x/text is a broad i18n/text collection spanning many tasks)
- `golang.org/x/net` #6, 276,704 dependents (low confidence: x/net is a broad collection (http2, html, proxy, etc.))
- `golang.org/x/crypto` #8, 269,003 dependents (low confidence: x/crypto is a broad collection of unrelated crypto primitives)
- `google.golang.org/grpc` #28, 158,189 dependents (low confidence: gRPC is an RPC framework spanning many tasks)
- `golang.org/x/exp` #35, 150,501 dependents (low confidence: experimental grab-bag of general-purpose packages)
- `github.com/go-kit/kit` #106, 101,143 dependents (low confidence: microservice toolkit spanning many concerns)
- `k8s.io/utils` #259, 42,565 dependents (low confidence: k8s utility grab-bag)
- `k8s.io/apiserver` #331, 29,044 dependents
- `gonum.org/v1/gonum` #363, 25,546 dependents
- `sigs.k8s.io/controller-runtime` #566, 15,336 dependents
- `github.com/go-git/go-git/v5` #618, 13,417 dependents (low confidence: broad git implementation)
- `go4.org` #718, 10,288 dependents (low confidence: Grab-bag of unrelated utility packages)

## Non-deflate compression

Compress and decompress byte buffers with a codec other than deflate, such as Zstandard, Brotli, LZ4, Snappy or bzip2; deflate, zlib and gzip framing and archive formats are out of scope.

- `github.com/golang/snappy` #119, 97,234 dependents
- `github.com/klauspost/compress` #161, 72,706 dependents (low confidence: mixed library with gzip/flate and zstd, snappy, s2 codecs)
- `github.com/pierrec/lz4` #230, 49,109 dependents
- `github.com/eapache/go-xerial-snappy` #286, 37,215 dependents
- `github.com/andybalholm/brotli` #401, 22,214 dependents
- `github.com/ulikunitz/xz` #530, 16,976 dependents
- `github.com/DataDog/zstd` #682, 10,824 dependents
- `github.com/btcsuite/snappy-go` #753, 9,426 dependents
- `github.com/xi2/xz` #845, 7,608 dependents
- `github.com/glycerine/go-unsnap-stream` #848, 7,529 dependents (low confidence: Snappy streaming decompression helper; unrecognized)
- `github.com/cloudflare/golz4` #967, 6,131 dependents
- `github.com/dsnet/compress` #986, 5,948 dependents

## Macro and derive support

Procedural macro and derive crates, the libraries they are built from and code generators, all of which run inside the compiler rather than in the built program.

- `github.com/envoyproxy/protoc-gen-validate` #59, 123,694 dependents (low confidence: protoc plugin code generator)
- `github.com/grpc-ecosystem/grpc-gateway` #81, 107,807 dependents (low confidence: protoc plugin/gateway code generator and runtime)
- `k8s.io/gengo` #270, 40,485 dependents
- `google.golang.org/grpc/cmd/protoc-gen-go-grpc` #299, 35,235 dependents (low confidence: protoc plugin code generator)
- `k8s.io/code-generator` #356, 26,587 dependents (low confidence: Kubernetes code generators; no description)
- `github.com/lyft/protoc-gen-validate` #448, 20,257 dependents (low confidence: protoc plugin code generator)
- `github.com/lyft/protoc-gen-star` #586, 14,474 dependents
- `modernc.org/golex` #597, 14,096 dependents (low confidence: lex generator)
- `github.com/dave/jennifer` #775, 8,953 dependents
- `github.com/matryer/moq` #777, 8,888 dependents
- `github.com/shurcooL/vfsgen` #782, 8,800 dependents
- `github.com/cheekybits/genny` #790, 8,552 dependents

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `github.com/google/uuid` #45, 141,184 dependents
- `github.com/rogpeppe/fastuuid` #90, 104,655 dependents
- `github.com/hashicorp/go-uuid` #147, 79,476 dependents
- `github.com/oklog/ulid` #190, 63,064 dependents
- `github.com/satori/go.uuid` #218, 53,217 dependents
- `github.com/pborman/uuid` #262, 41,939 dependents
- `github.com/gofrs/uuid` #269, 40,709 dependents
- `github.com/rs/xid` #297, 35,925 dependents
- `github.com/nats-io/nuid` #334, 28,896 dependents
- `github.com/marstr/guid` #556, 15,730 dependents

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `github.com/spf13/pflag` #46, 140,663 dependents
- `github.com/spf13/cobra` #75, 109,476 dependents
- `gopkg.in/alecthomas/kingpin.v2` #104, 101,534 dependents
- `github.com/mitchellh/cli` #160, 72,776 dependents (low confidence: CLI framework with subcommands)
- `github.com/urfave/cli` #207, 57,081 dependents
- `github.com/jessevdk/go-flags` #229, 49,247 dependents
- `github.com/docopt/docopt-go` #276, 39,765 dependents
- `github.com/google/subcommands` #809, 8,284 dependents
- `gopkg.in/urfave/cli.v1` #858, 7,187 dependents

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `github.com/julienschmidt/httprouter` #91, 104,251 dependents
- `github.com/gorilla/mux` #117, 97,463 dependents
- `github.com/gin-gonic/gin` #212, 55,159 dependents
- `github.com/emicklei/go-restful` #260, 42,447 dependents
- `github.com/zenazn/goji` #439, 20,556 dependents
- `github.com/labstack/echo/v4` #502, 17,976 dependents
- `github.com/go-chi/chi` #657, 12,002 dependents
- `github.com/urfave/negroni` #692, 10,474 dependents (low confidence: middleware manager only)
- `github.com/bmizerany/pat` #899, 6,658 dependents

## INI and properties parsing

Parse INI-style or Java .properties text of sections and name=value pairs into an in-memory structure; TOML, YAML and other JSON-superset formats, dotenv loading into the process environment and layered configuration managers are out of scope.

- `github.com/magiconair/properties` #115, 98,179 dependents
- `gopkg.in/ini.v1` #146, 79,572 dependents
- `gopkg.in/gcfg.v1` #336, 28,786 dependents
- `github.com/go-ini/ini` #368, 25,388 dependents
- `github.com/kevinburke/ssh_config` #461, 19,749 dependents (low confidence: SSH config files, not strictly INI)
- `github.com/jackc/pgservicefile` #499, 18,022 dependents (low confidence: Parser for PostgreSQL service files, INI-style)
- `github.com/go-git/gcfg` #620, 13,403 dependents
- `github.com/aws/aws-sdk-go-v2/internal/ini` #695, 10,420 dependents
- `github.com/src-d/gcfg` #835, 7,842 dependents

## JSON path queries

Evaluate a path or query expression such as JSONPath, JMESPath or JSON Pointer against in-memory JSON-like data and return the selected values; JSON parsing, JSON Patch and schema validation are out of scope.

- `github.com/jmespath/go-jmespath` #151, 75,449 dependents
- `github.com/go-openapi/jsonpointer` #206, 57,232 dependents
- `github.com/xeipuuv/gojsonpointer` #320, 30,784 dependents
- `github.com/buger/jsonparser` #402, 22,092 dependents (low confidence: Fetches values by key path from raw JSON bytes; could equally be json-parsing)
- `github.com/bitly/go-simplejson` #472, 19,085 dependents (low confidence: Wraps JSON with path accessors)
- `github.com/tidwall/gjson` #619, 13,403 dependents
- `github.com/exponent-io/jsonpath` #690, 10,487 dependents (low confidence: token stream navigation)
- `github.com/yalp/jsonpath` #969, 6,085 dependents

## Metrics instrumentation

In-process registries of counters, gauges, timers and histograms that application code updates and that render a snapshot for a monitoring system; standalone histogram data structures, distributed tracing and vendor agents that only ship data to one service are out of scope.

- `github.com/prometheus/client_golang` #83, 107,337 dependents
- `github.com/armon/go-metrics` #162, 72,534 dependents
- `github.com/rcrowley/go-metrics` #274, 40,144 dependents
- `github.com/circonus-labs/circonus-gometrics` #382, 23,933 dependents
- `github.com/performancecopilot/speed` #455, 19,912 dependents (low confidence: PCP instrumentation client)
- `github.com/docker/go-metrics` #517, 17,296 dependents
- `github.com/yvasiyarov/go-metrics` #542, 16,336 dependents
- `github.com/paulbellamy/ratecounter` #965, 6,144 dependents (low confidence: rate counter only)

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `github.com/fatih/color` #107, 101,086 dependents
- `github.com/morikuni/aec` #348, 27,240 dependents
- `github.com/mgutz/ansi` #557, 15,694 dependents
- `github.com/k0kubun/colorstring` #622, 13,335 dependents
- `github.com/logrusorgru/aurora` #623, 13,283 dependents
- `github.com/daviddengcn/go-colortext` #681, 10,841 dependents
- `github.com/gookit/color` #686, 10,546 dependents

## Value inspection and formatting

Render arbitrary JavaScript values as human-readable strings for logs, assertions and snapshots; JSON serialization and diffing are out of scope.

- `github.com/davecgh/go-spew` #3, 281,169 dependents
- `github.com/kr/pretty` #19, 195,495 dependents
- `github.com/niemeyer/pretty` #189, 63,182 dependents
- `github.com/kylelemons/godebug` #313, 31,952 dependents (low confidence: Unrecognized details; believed pretty-printer plus diff)
- `github.com/shurcooL/go-goon` #526, 17,029 dependents
- `github.com/yudai/pp` #722, 10,210 dependents
- `github.com/apparentlymart/go-dump` #787, 8,599 dependents (low confidence: Dumps cty values; unrecognized)

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `github.com/hashicorp/go-cleanhttp` #148, 78,667 dependents (low confidence: builds clean HTTP transports and clients, not a request API itself)
- `gopkg.in/resty.v1` #173, 70,509 dependents
- `github.com/hashicorp/go-retryablehttp` #301, 34,302 dependents
- `github.com/tv42/httpunix` #350, 27,177 dependents (low confidence: Unix socket HTTP transport)
- `github.com/valyala/fasthttp` #370, 25,287 dependents (low confidence: Both HTTP client and server; client side benchmarkable)
- `github.com/franela/goreq` #435, 20,757 dependents
- `github.com/go-resty/resty/v2` #849, 7,496 dependents

## Non-cryptographic hashing

Fast hash functions for hash tables and fingerprints, such as FNV, xxHash, SipHash and Murmur; cryptographic digests and error-detecting checksums are out of scope.

- `github.com/cespare/xxhash/v2` #130, 89,948 dependents
- `github.com/spaolacci/murmur3` #132, 86,696 dependents
- `github.com/OneOfOne/xxhash` #139, 84,664 dependents
- `github.com/dgryski/go-sip13` #194, 60,452 dependents
- `github.com/dgryski/go-farm` #550, 15,795 dependents
- `github.com/aead/siphash` #755, 9,401 dependents
- `github.com/minio/highwayhash` #863, 7,097 dependents

## Text diffing

Compute the line or element differences between two texts or sequences; edit-distance scores, assertion pretty-printers and structured JSON patches are out of scope.

- `github.com/pmezard/go-difflib` #2, 281,215 dependents
- `github.com/sergi/go-diff` #200, 59,574 dependents
- `github.com/pkg/diff` #303, 34,242 dependents
- `github.com/andreyvit/diff` #428, 21,086 dependents
- `github.com/aryann/difflib` #456, 19,909 dependents
- `github.com/yudai/golcs` #675, 11,158 dependents
- `github.com/shazow/go-diff` #895, 6,720 dependents (low confidence: unrecognized; no description)

## Embedded key-value stores

Persistent, ordered key-value databases that run inside the application process and store data in local files, such as B+tree and LSM-tree engines; in-memory caches, SQL engines and clients for a database server are out of scope.

- `go.etcd.io/bbolt` #158, 73,855 dependents
- `github.com/coreos/bbolt` #196, 60,291 dependents
- `github.com/peterbourgon/diskv` #256, 43,169 dependents
- `github.com/syndtr/goleveldb` #488, 18,213 dependents
- `github.com/boltdb/bolt` #519, 17,237 dependents
- `github.com/btcsuite/goleveldb` #752, 9,439 dependents
- `github.com/dgraph-io/badger` #808, 8,290 dependents

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `github.com/go-playground/validator/v10` #221, 52,342 dependents
- `github.com/asaskevich/govalidator` #250, 44,225 dependents (low confidence: string and struct validators)
- `github.com/xeipuuv/gojsonschema` #327, 30,317 dependents
- `github.com/Azure/go-autorest/autorest/validation` #468, 19,317 dependents (low confidence: Reflection-based parameter validation)
- `github.com/go-openapi/validate` #507, 17,754 dependents
- `gopkg.in/go-playground/validator.v9` #608, 13,772 dependents

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `rsc.io/sampler` #133, 86,657 dependents (low confidence: sample greeting texts example module)
- `rsc.io/quote/v3` #137, 85,240 dependents (low confidence: sample quotes example module)
- `github.com/go-playground/locales` #198, 59,888 dependents (low confidence: locale data tables)
- `github.com/certifi/gocertifi` #537, 16,745 dependents (low confidence: CA cert bundle)
- `github.com/go-git/go-git-fixtures/v4` #624, 13,279 dependents (low confidence: test fixtures data)
- `github.com/shurcooL/gofontwoff` #913, 6,548 dependents

## Histograms and quantile sketches

Record a stream of numeric samples into a compact fixed-memory histogram or sketch, such as HDR Histogram, t-digest or a biased quantile stream, and query percentiles from it; exact descriptive statistics over full arrays and metrics registries that export to a monitoring system are out of scope.

- `github.com/beorn7/perks` #86, 106,860 dependents
- `github.com/codahale/hdrhistogram` #369, 25,287 dependents
- `github.com/circonus-labs/circonusllhist` #384, 23,898 dependents
- `github.com/VividCortex/gohistogram` #403, 22,010 dependents
- `github.com/influxdata/tdigest` #846, 7,599 dependents
- `github.com/HdrHistogram/hdrhistogram-go` #864, 7,087 dependents

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `gopkg.in/yaml.v2` #11, 247,600 dependents
- `github.com/ghodss/yaml` #61, 120,940 dependents
- `github.com/hashicorp/hcl` #102, 101,850 dependents (low confidence: HCL is not a JSON superset but is a human-friendly config language)
- `sigs.k8s.io/yaml` #191, 62,246 dependents
- `sigs.k8s.io/kustomize/kyaml` #823, 8,193 dependents (low confidence: k8s-flavored YAML read/write library)

## Identifier case conversion

Convert strings between naming conventions such as camelCase, snake_case and kebab-case; Unicode case folding and case-insensitive comparison are out of scope.

- `github.com/stoewer/go-strcase` #361, 25,652 dependents
- `github.com/gobuffalo/flect` #386, 23,747 dependents
- `github.com/iancoleman/strcase` #462, 19,717 dependents
- `github.com/fatih/camelcase` #665, 11,603 dependents
- `github.com/naoina/go-stringutil` #769, 9,063 dependents (low confidence: Unrecognized; likely string case helpers)

## Retry policies

Re-run a failing function according to a policy of attempts, backoff and jitter, or guard it with a circuit breaker; rate limiters, task queues and HTTP-client-specific transports are out of scope.

- `github.com/jpillora/backoff` #242, 46,493 dependents
- `github.com/eapache/go-resiliency` #291, 36,682 dependents
- `github.com/cenkalti/backoff` #329, 30,189 dependents
- `github.com/afex/hystrix-go` #422, 21,232 dependents (low confidence: Circuit breaker plus latency tolerance)
- `github.com/sony/gobreaker` #423, 21,169 dependents

## Shell word splitting

Split a command-line string into argument words following POSIX shell quoting and escaping rules, or quote words back into such a string; argv option parsing and spawning the command are out of scope.

- `github.com/flynn/go-shlex` #333, 28,899 dependents
- `github.com/anmitsu/go-shlex` #353, 26,986 dependents
- `github.com/mattn/go-shellwords` #434, 20,760 dependents
- `github.com/google/shlex` #546, 16,046 dependents
- `github.com/kballard/go-shellquote` #558, 15,642 dependents

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `github.com/json-iterator/go` #40, 143,681 dependents
- `github.com/goccy/go-json` #531, 16,915 dependents
- `sigs.k8s.io/json` #564, 15,401 dependents
- `github.com/bytedance/sonic` #737, 9,818 dependents

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `github.com/dgrijalva/jwt-go` #113, 98,905 dependents
- `gopkg.in/square/go-jose.v2` #273, 40,168 dependents
- `github.com/form3tech-oss/jwt-go` #310, 32,324 dependents
- `github.com/golang-jwt/jwt/v4` #394, 22,852 dependents

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `gopkg.in/inf.v0` #213, 54,970 dependents
- `github.com/shopspring/decimal` #293, 36,577 dependents
- `github.com/cockroachdb/apd` #357, 26,502 dependents
- `github.com/remyoudompheng/bigfft` #471, 19,131 dependents

## LRU caches

Bounded in-memory key-value caches that evict the least recently used entry; unbounded maps, memoization decorators and remote cache clients are out of scope.

- `github.com/hashicorp/golang-lru` #53, 128,405 dependents
- `github.com/dgraph-io/ristretto` #670, 11,346 dependents (low confidence: TinyLFU bounded cache, not strictly LRU)
- `github.com/allegro/bigcache` #879, 6,895 dependents (low confidence: bounded cache with FIFO/TTL eviction rather than LRU)
- `github.com/VictoriaMetrics/fastcache` #904, 6,615 dependents (low confidence: bounded size-capped cache, eviction is not strictly LRU)

## ASN.1 DER decoding

Parse and encode ASN.1 structures in BER or DER, including X.509 certificates; PEM text framing, certificate chain verification and TLS are out of scope.

- `github.com/fullsailor/pkcs7` #632, 12,939 dependents (low confidence: PKCS#7 over ASN.1; not sure)
- `go.mozilla.org/pkcs7` #635, 12,757 dependents (low confidence: PKCS#7 over ASN.1; not sure)
- `github.com/go-asn1-ber/asn1-ber` #894, 6,728 dependents
- `gopkg.in/asn1-ber.v1` #934, 6,474 dependents

## WebSocket messaging

Implement the WebSocket protocol as a client, a server or a bring-your-own-I/O state machine and exchange framed messages; Socket.IO-style layers on top, server-sent events and raw HTTP are out of scope.

- `github.com/gorilla/websocket` #80, 107,879 dependents
- `github.com/gobwas/ws` #604, 13,858 dependents
- `github.com/btcsuite/websocket` #749, 9,482 dependents
- `nhooyr.io/websocket` #935, 6,463 dependents

## Template rendering

Compile a text template with embedded expressions, loops and partials (ERB, Haml, Slim, Liquid, Mustache and the like) and render it to a string with given data; Markdown conversion, HTML builders driven purely by code and framework view layers are out of scope.

- `github.com/alecthomas/template` #92, 104,236 dependents
- `github.com/valyala/fasttemplate` #364, 25,529 dependents
- `github.com/valyala/quicktemplate` #758, 9,256 dependents
- `github.com/eknkc/amber` #889, 6,822 dependents

## Semantic version comparison

Parse semantic version strings, order them and test them against range constraints; language-specific version schemes with no range syntax and dependency resolvers are out of scope.

- `github.com/coreos/go-semver` #125, 95,334 dependents
- `github.com/hashicorp/go-version` #252, 44,013 dependents
- `github.com/blang/semver` #298, 35,600 dependents
- `github.com/Masterminds/semver/v3` #344, 27,798 dependents

## Sorted maps and prefix trees

Mutable in-memory key-value containers that keep keys in sorted order, such as B-trees, radix trees and skip lists, and support ordered, range or prefix iteration; hash tables, persistent immutable variants, bounded caches and on-disk stores are out of scope.

- `github.com/google/btree` #52, 129,423 dependents
- `github.com/armon/go-radix` #156, 74,471 dependents
- `github.com/emirpasic/gods` #424, 21,160 dependents
- `github.com/tchap/go-patricia` #633, 12,811 dependents

## Glob matching

Test whether path strings match a glob pattern, purely in memory; walking the filesystem, gitignore rule sets and brace-only expansion are out of scope.

- `github.com/gobwas/glob` #417, 21,281 dependents
- `github.com/tidwall/match` #617, 13,438 dependents
- `github.com/ryanuber/go-glob` #667, 11,534 dependents

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `github.com/leodido/go-urn` #193, 61,134 dependents (low confidence: parses URNs, a URI subtype)
- `github.com/PuerkitoBio/purell` #223, 52,152 dependents (low confidence: URL normalization)
- `github.com/PuerkitoBio/urlesc` #224, 52,077 dependents (low confidence: query escaping)

## UI components and hooks

Browser UI component libraries, icon sets, positioning engines and React hooks, whose work is rendering and interaction rather than one standard computational task.

- `github.com/shurcooL/octicon` #870, 7,012 dependents
- `dmitri.shuralyov.com/html/belt` #918, 6,525 dependents
- `github.com/shurcooL/component` #921, 6,520 dependents

## TOML parsing

Parse TOML text into values or a document tree; JSON-superset formats such as YAML and JSON5, INI files and layered configuration loaders are out of scope.

- `github.com/BurntSushi/toml` #20, 185,064 dependents
- `github.com/pelletier/go-toml` #87, 106,210 dependents
- `github.com/naoina/toml` #792, 8,512 dependents

## Digital signatures

Generate key pairs, sign messages and verify signatures with ECDSA, Ed25519 or RSA; signature trait definitions, JWT framing and certificate handling are out of scope.

- `github.com/nats-io/nkeys` #338, 28,527 dependents
- `github.com/docker/libtrust` #485, 18,262 dependents (low confidence: Key management with signing; unsure)
- `github.com/decred/dcrd/dcrec/secp256k1/v4` #992, 5,893 dependents

## Date and time

Parse, format and do calendar arithmetic on dates, times and durations; time zone database packages, HTTP-date-only helpers and clock sources are out of scope.

- `github.com/Azure/go-autorest/autorest/date` #233, 47,363 dependents (low confidence: swagger date types)
- `github.com/jinzhu/now` #308, 32,573 dependents
- `github.com/golang-sql/civil` #349, 27,232 dependents (low confidence: Civil date/time types only)

## Markdown rendering

Parse CommonMark-style Markdown text and render it to HTML or a syntax tree; converting HTML or office documents to Markdown, reStructuredText and terminal rendering are out of scope.

- `github.com/yuin/goldmark` #51, 131,427 dependents
- `github.com/russross/blackfriday/v2` #100, 102,165 dependents
- `github.com/shurcooL/github_flavored_markdown` #900, 6,656 dependents

## Text table rendering

Lay out rows of values as an aligned plain-text or ASCII table; full terminal UI toolkits, progress bars and spreadsheet files are out of scope.

- `github.com/ryanuber/columnize` #164, 72,350 dependents
- `github.com/olekukonko/tablewriter` #208, 56,368 dependents
- `github.com/liggitt/tabwriter` #673, 11,258 dependents

## PostgreSQL clients

Speak the PostgreSQL wire protocol to run queries and decode result rows; ORMs, query builders, connection-pool add-ons and drivers for other databases are out of scope.

- `github.com/lib/pq` #144, 81,738 dependents
- `github.com/jackc/pgx/v4` #484, 18,275 dependents
- `github.com/jackc/pgconn` #491, 18,196 dependents

## Redis clients

Speak the Redis protocol to send commands and decode replies; key namespacing wrappers, cache or session stores built on a client, in-memory fakes and job queues are out of scope.

- `github.com/garyburd/redigo` #464, 19,396 dependents
- `github.com/go-redis/redis` #487, 18,227 dependents
- `github.com/gomodule/redigo` #506, 17,780 dependents

## Dotenv loading

Parse a .env file of KEY=value lines, with quoting and variable expansion, and load the pairs into the process environment or a map; decoding environment variables into typed structs and general INI or configuration managers are out of scope.

- `github.com/subosito/gotenv` #175, 69,834 dependents
- `github.com/joho/godotenv` #225, 51,498 dependents
- `github.com/gobuffalo/envy` #389, 23,269 dependents

## File system watching

Subscribe to create, write, rename and remove notifications for files and directories through the operating system's notification facility; following the appended lines of one log file and polling build watchers tied to one tool are out of scope.

- `github.com/fsnotify/fsnotify` #43, 141,733 dependents
- `gopkg.in/fsnotify.v1` #120, 96,993 dependents
- `github.com/rjeczalik/notify` #844, 7,624 dependents

## Recursive file copying

Copy a file or a whole directory tree to a new location, preserving structure and modes; atomic single-file replacement, archive extraction and virtual file system abstractions are out of scope.

- `github.com/mrunalp/fileutils` #486, 18,247 dependents
- `github.com/otiai10/copy` #607, 13,787 dependents
- `github.com/cespare/cp` #956, 6,222 dependents

## Deep cloning

Produce an independent deep copy of an arbitrary in-memory value such as nested structs, maps and slices; merging several sources into one target, serialization to bytes and immutable collections are out of scope.

- `github.com/mitchellh/copystructure` #346, 27,543 dependents
- `github.com/mohae/deepcopy` #609, 13,709 dependents
- `github.com/jinzhu/copier` #962, 6,204 dependents

## Human-readable size formatting

Format byte counts and other quantities as short human-readable strings with unit suffixes such as 1.5 MiB, and parse such strings back to numbers; date and duration phrasing, locale-aware number formatting and arbitrary-precision arithmetic are out of scope.

- `github.com/alecthomas/units` #94, 103,229 dependents
- `github.com/dustin/go-humanize` #184, 67,492 dependents
- `github.com/docker/go-units` #253, 43,744 dependents

## MongoDB clients

Speak the MongoDB wire protocol to run commands and encode and decode BSON documents; object-document mappers and drivers for other databases are out of scope.

- `go.mongodb.org/mongo-driver` #295, 36,142 dependents
- `github.com/globalsign/mgo` #474, 19,023 dependents
- `gopkg.in/mgo.v2` #593, 14,218 dependents

## Source map decoding

Decode source map VLQ mappings and trace generated positions back to original ones; generating maps while editing code and converting map container formats are out of scope.

- `github.com/neelance/sourcemap` #834, 7,883 dependents
- `github.com/go-sourcemap/sourcemap` #885, 6,855 dependents

## Deep equality

Compare two JavaScript values for structural equality; assertion libraries, diff output and shallow comparison are out of scope.

- `github.com/google/go-cmp` #15, 201,810 dependents
- `github.com/go-test/deep` #406, 21,960 dependents

## Object merging

Copy or recursively merge properties of source objects into a target object; cloning a single value, immutable-update libraries and Object.assign ponyfills are out of scope.

- `github.com/imdario/mergo` #192, 61,876 dependents
- `sigs.k8s.io/structured-merge-diff/v4` #304, 34,068 dependents (low confidence: Kubernetes typed structured merge and diff of objects; no description)

## Directory walking

Recursively enumerate every file and directory under a root; glob pattern expansion and file watching are out of scope.

- `github.com/kr/fs` #220, 52,525 dependents
- `github.com/karrick/godirwalk` #365, 25,526 dependents

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `github.com/alcortesm/tgz` #651, 12,161 dependents (low confidence: tgz extract helper)
- `github.com/containerd/stargz-snapshotter/estargz` #754, 9,423 dependents (low confidence: Builds seekable eStargz archives from tar+gzip)

## Terminal string width

Compute how many terminal columns a string or code point occupies, accounting for wide East Asian characters; wrapping, truncating and stripping styled text are out of scope.

- `github.com/mattn/go-runewidth` #153, 75,041 dependents
- `github.com/rivo/uniseg` #421, 21,251 dependents

## Indentation stripping

Remove common leading whitespace from multi-line strings; adding indentation, word wrapping and code formatting are out of scope.

- `github.com/MakeNowJust/heredoc` #664, 11,759 dependents
- `github.com/lithammer/dedent` #725, 10,138 dependents

## Bit sets

Compact collections of bits with set, test and bulk boolean operations; flag-enum macros and compressed bitmaps for serialization are out of scope.

- `github.com/willf/bitset` #449, 20,239 dependents
- `github.com/bits-and-blooms/bitset` #602, 13,930 dependents

## Cryptographic hashing

Compute cryptographic message digests such as SHA-1, SHA-2, SHA-3, BLAKE and MD5; HMAC, key derivation, password hashing and non-cryptographic hashes are out of scope.

- `github.com/minio/sha256-simd` #750, 9,469 dependents
- `github.com/decred/dcrd/crypto/blake256` #983, 5,968 dependents

## Regular expression matching

Compile regular expressions and search text with them; regex syntax parsers on their own, glob matching and literal substring search are out of scope.

- `rsc.io/binaryregexp` #101, 102,090 dependents
- `github.com/dlclark/regexp2` #721, 10,221 dependents

## CSS selector matching

Compile CSS selectors and find the matching elements in an already parsed HTML or XML tree; parsing whole stylesheets and parsing the document itself are out of scope.

- `github.com/PuerkitoBio/goquery` #467, 19,320 dependents
- `github.com/andybalholm/cascadia` #469, 19,289 dependents

## Immutable collections

Immutable or persistent maps, lists and sets whose updates return a new version, usually with structural sharing; mutable ordered, sorted or multi-value containers are out of scope.

- `github.com/hashicorp/go-immutable-radix` #163, 72,407 dependents
- `github.com/lann/ps` #950, 6,273 dependents

## Chart rendering

Turn numeric series into a static chart image or vector file; interactive widget front ends, graph-layout tools such as Graphviz and terminal sparklines are out of scope.

- `github.com/ajstarks/svgo` #518, 17,274 dependents (low confidence: SVG drawing primitives, not a chart library per se)
- `gonum.org/v1/plot` #535, 16,834 dependents

## File locking

Acquire and release cross-process advisory locks backed by a lock file; in-process mutexes and distributed locks held in a remote service are out of scope.

- `github.com/gofrs/flock` #525, 17,036 dependents
- `github.com/alexflint/go-filemutex` #634, 12,789 dependents

## MySQL clients

Speak the MySQL wire protocol to run queries and decode result rows; ORMs, query builders and drivers for other databases are out of scope.

- `github.com/go-sql-driver/mysql` #126, 94,880 dependents
- `github.com/ziutek/mymysql` #741, 9,667 dependents

## Message translation

Look up translated messages by key or source string in loaded catalogs, with interpolation and plural forms; locale data packages, framework glue and date or number formatting are out of scope.

- `github.com/go-playground/universal-translator` #197, 59,903 dependents
- `github.com/chai2010/gettext-go` #699, 10,384 dependents

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `github.com/mattn/go-colorable` #48, 134,844 dependents (low confidence: windows ANSI colour-writer shim)

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `github.com/clbanning/x2j` #451, 20,156 dependents (low confidence: Converts XML to maps; deprecated)

## Filesystem globbing

Expand glob patterns into the list of matching paths by walking the filesystem; in-memory pattern matching and unfiltered directory crawling are out of scope.

- `github.com/mattn/go-zglob` #878, 6,897 dependents

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `golang.org/x/sync` #12, 216,924 dependents

## Event emitters

In-process publish/subscribe objects with on/off/emit semantics; DOM EventTarget implementations, plugin hook systems and reactive streams are out of scope.

- `github.com/docker/go-events` #601, 14,034 dependents (low confidence: pub/sub sinks and queues; unsure)

## Deflate compression

Compress and decompress byte buffers with deflate, zlib or gzip framing; archive formats and string-oriented LZ codecs are out of scope.

- `github.com/klauspost/pgzip` #638, 12,689 dependents

## Color parsing and conversion

Parse CSS color strings and convert between color spaces such as RGB, HSL and Lab; terminal styling, named-color tables and interpolation are out of scope.

- `github.com/lucasb-eyer/go-colorful` #813, 8,258 dependents

## Hash maps

General-purpose in-memory key-value hash tables, including insertion-ordered and concurrent variants; bounded caches, tries, slabs and the hash functions themselves are out of scope.

- `github.com/deckarep/golang-set` #761, 9,165 dependents (low confidence: Generic set collection; closest is hash-based containers)

## Message channels

In-process queues that pass values between threads or async tasks with send and receive ends; event emitters, OS pipes and network sockets are out of scope.

- `github.com/acomagu/bufpipe` #770, 9,062 dependents (low confidence: In-memory IO pipe with buffer; loose fit)

## Checksums

Compute error-detecting checksums such as CRC-32, CRC-32C and Adler-32 over byte buffers; cryptographic digests and hash-table hashes are out of scope.

- `github.com/klauspost/crc32` #914, 6,531 dependents

## Random number generation

Pseudo-random number generators that produce integers, floats and byte fills from a seed; OS entropy sources, random ID strings and statistical distributions are out of scope.

- `github.com/sean-/seed` #180, 68,992 dependents (low confidence: seeds math/rand from crypto entropy)

## Base64 encoding

Encode bytes to base64 text and decode them back; hexadecimal, base58 and other alphabets, and PEM framing are out of scope.

- `github.com/chenzhuoyu/base64x` #613, 13,609 dependents

## Parser combinators and generators

Libraries for writing a parser for an arbitrary grammar from combinators or a grammar definition; parsers for one fixed format and lexer-only generators are out of scope.

- `github.com/antlr/antlr4/runtime/Go/antlr` #826, 8,040 dependents

## HTML sanitizing

Strip disallowed tags, attributes and scripts from untrusted HTML according to an allow-list and return safe HTML; plain entity escaping and general HTML parsing are out of scope.

- `github.com/microcosm-cc/bluemonday` #574, 15,065 dependents

## Typed object mapping

Convert plain dictionaries and lists into instances of declared record classes and back again, following the field types; validation-first schema libraries, binary wire formats and pickling of arbitrary objects are out of scope.

- `github.com/mitchellh/mapstructure` #57, 124,571 dependents

## Dataframes

In-memory columnar tables with filter, join, group-by and aggregate operations; compatibility layers over other dataframe libraries, file-format readers alone and remote warehouse clients are out of scope.

- `github.com/apache/arrow/go/arrow` #731, 9,970 dependents (low confidence: Arrow columnar arrays and compute; approximate fit)

## Image processing

Decode raster images, apply pixel operations such as resize and crop, and encode the result; single-format codecs, header-only size readers and OCR are out of scope.

- `golang.org/x/image` #67, 117,023 dependents (low confidence: x/image mostly codecs/drawing helpers)

## PDF reading

Open existing PDF files and extract their text and page structure; creating new PDFs and rasterizing pages through external command-line tools are out of scope.

- `rsc.io/pdf` #335, 28,789 dependents

## PDF generation

Produce new PDF documents from text, tables and drawing commands or from HTML; reading, splitting and merging existing PDFs are out of scope.

- `github.com/jung-kurt/gofpdf` #512, 17,508 dependents

## Dynamic attribute objects

Wrap a nested dictionary in an object whose keys are read and written as attributes or method calls; declared record classes with typed fields and immutable collections are out of scope.

- `github.com/stretchr/objx` #9, 267,615 dependents (low confidence: map/slice accessor utilities; loose fit)
