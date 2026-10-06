# Package categories: crates.io

1000 of 1000 packages categorized into 129 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Language-level abstractions (`language-ergonomics`) | 139 | no |  |
| Macro and derive support (`macro-support`) | 120 | no |  |
| System and foreign bindings (`system-bindings`) | 93 | no |  |
| Other (no peers yet) (`other`) | 93 | no |  |
| Library internals (`library-internals`) | 68 | no |  |
| Service SDKs and telemetry (`service-sdks`) | 32 | no |  |
| Environment detection (`environment-detection`) | 26 | no |  |
| Build, lint and test tooling (`build-tooling`) | 20 | no |  |
| Binary serialization (`binary-serialization`) | 15 | yes | Encode and decode 100,000 records with nested integers, strings and arrays. |
| Static data and patterns (`static-data`) | 13 | no |  |
| Platform-specific binaries (`platform-binaries`) | 11 | no |  |
| Non-cryptographic hashing (`non-cryptographic-hashing`) | 11 | yes | Hash 1,000,000 short keys and one 64 MB buffer to a 64-bit value. |
| Cryptographic hashing (`cryptographic-hashing`) | 11 | yes | Digest a 64 MB buffer and 100,000 64-byte messages with the package's primary algorithm. |
| Non-deflate compression (`block-compression`) | 11 | yes | Compress and decompress a fixed 32 MB mixed text and binary corpus at the default level. |
| Message channels (`message-channels`) | 10 | yes | Send 1,000,000 small messages from four producers to one consumer through a bounded channel. |
| ASN.1 DER decoding (`asn1-der-decoding`) | 10 | yes | Decode a fixed set of 1,000 DER-encoded X.509 certificates into their fields. |
| Terminal string styling (`terminal-styling`) | 9 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 9 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| Hash maps (`hash-maps`) | 9 | yes | Insert 1,000,000 integer and string keys, look each up, iterate, then remove half. |
| Random number generation (`random-number-generation`) | 9 | yes | Seed a generator, draw 10,000,000 64-bit integers and fill a 64 MB buffer. |
| Framework and tool extensions (`framework-extensions`) | 9 | no |  |
| Frameworks and broad libraries (`frameworks`) | 7 | no |  |
| Checksums (`checksums`) | 7 | yes | Checksum a 64 MB buffer in one call and again in 4 KB incremental updates. |
| Digital signatures (`digital-signatures`) | 7 | yes | Generate a key pair, then sign and verify 10,000 short messages. |
| Deflate compression (`deflate-compression`) | 6 | yes | Gzip and then gunzip the same 10 MB mixed text and binary buffer. |
| Single-format image codecs (`image-decoding`) | 6 | yes | Decode 100 images of 4,000 by 3,000 pixels in the member's format to RGBA pixel buffers. |
| Synchronization primitives (`synchronization-primitives`) | 6 | yes | Have 8 threads each lock and unlock one shared mutex around a counter increment 1,000,000 times. |
| CLI argument parsing (`cli-argument-parsing`) | 5 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| Config format parsing (`config-format-parsing`) | 5 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| HTML and XML parsing (`markup-parsing`) | 5 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| Async concurrency control (`async-concurrency`) | 5 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| Float to string formatting (`float-formatting`) | 5 | yes | Format 10,000,000 pseudo-random f64 values into a reused buffer. |
| Regular expression matching (`regex-matching`) | 5 | yes | Compile a fixed set of 20 patterns and find all matches of each in a 10 MB text corpus. |
| UTF-8 validation and decoding (`utf8-validation`) | 5 | yes | Validate and decode to code points a 100 MB buffer of mixed ASCII and multi-byte UTF-8 text, plus the same buffer with 1 percent invalid sequences. |
| Unauthenticated symmetric ciphers (`symmetric-ciphers`) | 5 | yes | Encrypt and decrypt a 100 MB buffer and 1,000,000 buffers of 64 bytes with a fixed key and nonce. |
| Runtime helpers and shims (`runtime-shims`) | 4 | no |  |
| HTTP clients (`http-client`) | 4 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| HTTP server routing (`http-server-routing`) | 4 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| LRU caches (`lru-cache`) | 4 | yes | Replay a fixed Zipf-distributed trace of 1,000,000 get/set operations against a cache capped at 10,000 entries. |
| Bit sets (`bit-sets`) | 4 | yes | Set and test 1,000,000 pseudo-random bit positions, then union, intersect and count two sets. |
| Inline small vectors (`inline-vectors`) | 4 | yes | Create 1,000,000 short vectors of 1 to 8 integers by pushing, then iterate and drop them. |
| Base64 encoding (`base64-encoding`) | 4 | yes | Encode and decode a 16 MB buffer and 100,000 32-byte values with the standard alphabet. |
| Parser combinators and generators (`parser-combinators`) | 4 | yes | Implement the same JSON grammar with each library and parse a 10 MB JSON document. |
| TOML parsing (`toml-parsing`) | 4 | yes | Parse a fixed corpus of TOML documents, including a 5,000-line lockfile. |
| Authenticated encryption (`authenticated-encryption`) | 4 | yes | Seal and open a 16 MB buffer and 100,000 1 KB messages with one key. |
| Date and time (`date-time`) | 4 | yes | Parse 100,000 ISO 8601 timestamps, add calendar durations and format each back to a string. |
| Identifier case conversion (`case-conversion`) | 4 | yes | Convert 1,000,000 mixed identifiers to snake, camel and kebab case. |
| Structured logging (`structured-logging`) | 4 | yes | Log 1,000,000 records with five key-value fields each as JSON lines to a null sink. |
| Number parsing (`number-parsing`) | 4 | yes | Parse 10,000,000 integer strings and 10,000,000 float strings of 1 to 20 significant digits. |
| Message authentication codes (`message-authentication-codes`) | 4 | yes | Compute tags over 1,000,000 messages of 64 bytes and over 100 messages of 1 MB with a fixed key. |
| Linear algebra and arrays (`linear-algebra`) | 4 | yes | Multiply two 1,000 by 1,000 matrices of 64-bit floats and multiply 10,000,000 pairs of 4 by 4 matrices. |
| Slabs and slot maps (`slot-arenas`) | 4 | yes | Insert 1,000,000 values, remove every second one by key, insert 500,000 more and read every live value by key. |
| Small-string types (`small-strings`) | 4 | yes | Create 10,000,000 strings of 1 to 40 bytes from slices, clone each once and compare it with its source. |
| Text diffing (`text-diff`) | 3 | yes | Diff pairs of 10,000-line text files that differ by 1%, 10% and 50% of their lines. |
| Retry policies (`retry-policies`) | 3 | yes | Wrap a function that fails a fixed number of times before succeeding and call it 100,000 times with zero delay. |
| PostgreSQL clients (`postgres-client`) | 3 | yes | Against a local PostgreSQL server, insert 100,000 rows with a prepared statement and read them back. |
| Sorted maps and prefix trees (`sorted-maps`) | 3 | yes | Insert 1,000,000 string keys, look each up, then run a fixed set of range and prefix scans in key order. |
| Query string parsing (`query-string-parsing`) | 3 | yes | Parse 100,000 query strings of 20 percent-encoded key-value pairs each and serialize the results back to strings. |
| Path string manipulation (`path-manipulation`) | 3 | yes | Normalize 100,000 path strings with mixed separators and dot segments, and compute the relative path between 100,000 pairs. |
| PEM encoding (`pem-encoding`) | 3 | yes | Decode a 10 MB bundle of 5,000 PEM certificate and key blocks and encode the payloads back to PEM. |
| Substring search (`substring-search`) | 3 | yes | Find every occurrence of a single byte, of one 12-byte literal and of a set of 1,000 literals in a 100 MB text corpus. |
| Character set transcoding (`charset-transcoding`) | 3 | yes | Decode 10 MB of text in each of Shift_JIS, GBK and windows-1252 to Unicode and encode it back. |
| Filesystem globbing (`file-globbing`) | 2 | yes | Expand a fixed set of glob patterns such as **/*.js against a fixture directory tree and collect the matching paths. |
| Directory walking (`directory-walking`) | 2 | yes | Recursively list every file in a fixture tree of roughly 10,000 files across nested directories. |
| URL and URI parsing (`url-parsing`) | 2 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| Indentation stripping (`indentation-stripping`) | 2 | yes | Strip the common leading indentation from 10,000 multi-line text blocks of varying depth. |
| Namespaced debug logging (`debug-logging`) | 2 | yes | Create 100 namespaced loggers, enable half of them, and log 100,000 formatted messages to a null sink. |
| WebSocket messaging (`websocket-messaging`) | 2 | yes | Echo 100,000 text and binary messages over a loopback connection, or through the codec in memory. |
| Template rendering (`template-rendering`) | 2 | yes | Compile a template that loops over 1,000 records with a conditional and escaped interpolation, then render it 1,000 times. |
| HTTP message parsing (`http-message-parsing`) | 2 | yes | Parse a fixed buffer of 100,000 concatenated HTTP/1.1 requests with typical browser headers, collecting method, path and headers. |
| Semantic version comparison (`semver-comparison`) | 2 | yes | Parse a fixed list of 10,000 version strings, sort them, and test each against a fixed set of range constraints. |
| Shell word splitting (`shell-word-splitting`) | 2 | yes | Split a fixed list of 100,000 command lines with mixed single quotes, double quotes and backslash escapes into their argument words. |
| File system watching (`file-watching`) | 2 | yes | Watch a directory tree of 1,000 files, apply a fixed script of 10,000 creates, writes and removes, and collect every resulting event. |
| Human-readable size formatting (`human-size-formatting`) | 2 | yes | Format a fixed list of 1,000,000 byte counts as human-readable sizes and parse each resulting string back to a number. |
| Histograms and quantile sketches (`quantile-sketches`) | 2 | yes | Record a fixed stream of 10,000,000 latency samples and query the 50th, 90th, 99th and 99.9th percentiles. |
| Metrics instrumentation (`metrics-instrumentation`) | 2 | yes | Register 100 labelled counters, gauges and histograms, apply 10,000,000 updates from several threads, then render one text snapshot of the registry. |
| Generated API and schema types (`generated-api-types`) | 2 | no |  |
| Placeholder and test packages (`placeholder-packages`) | 2 | no |  |
| Wrapping, slicing and stripping styled terminal text (`ansi-text-layout`) | 2 | yes | Take 10,000 lines of 200 visible columns with ANSI color codes every few words, strip the escape codes from each line and word-wrap each line to 80 columns, each member running the operations it offers. |
| Percent encoding (`percent-encoding`) | 2 | yes | Encode and decode 100,000 strings of 100 characters, one third of which are reserved or non-ASCII characters. |
| IP address and CIDR parsing (`ip-address-parsing`) | 2 | yes | Parse 100,000 IPv4 and IPv6 address strings and test each against 100 CIDR ranges. |
| CSV parsing (`csv-parsing`) | 2 | yes | Parse a 100 MB CSV file of 1,000,000 rows and 10 columns, a quarter of the fields quoted, and write the rows back out. |
| Unicode normalization (`unicode-normalization`) | 2 | yes | Normalize a 50 MB multilingual corpus to each of NFC, NFD, NFKC and NFKD. |
| Unicode text segmentation (`unicode-segmentation`) | 2 | yes | Iterate over all grapheme cluster and word boundaries of a 50 MB multilingual corpus. |
| Key derivation (`key-derivation`) | 2 | yes | Derive 100,000 32-byte keys with HKDF-SHA-256 and 100 keys with PBKDF2-HMAC-SHA-256 at 100,000 iterations, each member running the functions it offers. |
| Queues and linked lists (`queues-and-linked-lists`) | 2 | yes | Push 10,000,000 items to the back and pop them from the front, keeping the queue at a steady length of 1,000. |
| DNS messages and resolution (`dns-message-codec`) | 2 | yes | Decode and re-encode 1,000,000 DNS response messages that carry 10 mixed A, AAAA, CNAME, MX and TXT records each. |
| Symbol demangling (`symbol-demangling`) | 2 | yes | Demangle 1,000,000 mangled symbol names taken from a large binary. |
| Expression evaluation (`expression-evaluation`) | 2 | yes | Compile 1,000 expressions of about 20 operators each and evaluate every one against 10,000 variable bindings. |
| Glob matching (`glob-matching`) | 1 | yes | Compile a fixed set of glob patterns and match each against a fixed list of 10,000 path strings. |
| Schema validation (`schema-validation`) | 1 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| Unique ID generation (`id-generation`) | 1 | yes | Generate one million random unique IDs using the package's default secure generator. |
| CSS stylesheet parsing (`css-parsing`) | 1 | yes | Parse one large real-world stylesheet (for example a CSS framework build) into the package's AST. |
| JSON parsing (`json-parsing`) | 1 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| Value inspection and formatting (`value-inspection`) | 1 | yes | Format a fixed set of nested objects, arrays, Maps, Sets and primitives into strings. |
| Child process execution (`process-execution`) | 1 | yes | Spawn the same trivial command 200 times and collect its stdout and exit code. |
| JWT signing and verification (`jwt-signing`) | 1 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Tar archiving (`tar-archiving`) | 1 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Terminal string width (`terminal-string-width`) | 1 | yes | Compute the display width of 100,000 strings mixing ASCII, CJK and emoji characters. |
| Markdown rendering (`markdown-parsing`) | 1 | yes | Render a fixed corpus of Markdown documents totalling several megabytes to HTML. |
| CSS selector matching (`css-selector-matching`) | 1 | yes | Run a fixed list of 100 selectors against a parsed 1 MB HTML document and count the matches. |
| JSON path queries (`json-path-query`) | 1 | yes | Compile a fixed set of path expressions and evaluate each against a 1 MB nested document. |
| Dataframes (`dataframes`) | 1 | yes | Load a 1,000,000-row table, filter it, group by a key column and compute sum and mean aggregates. |
| Chart rendering (`chart-rendering`) | 1 | yes | Render a line chart with 10 series of 10,000 points each to SVG or PNG. |
| Image processing (`image-processing`) | 1 | yes | Decode a fixed set of JPEG and PNG photos, resize each to a thumbnail and re-encode it. |
| Text table rendering (`text-table-rendering`) | 1 | yes | Render a table of 10,000 rows and 8 mixed-type columns to a string. |
| File locking (`file-locking`) | 1 | yes | Acquire and release an uncontended lock file 100,000 times, then repeat with several contending processes. |
| File type detection (`file-type-detection`) | 1 | yes | Identify the type of each of 10,000 buffers holding the first bytes of files in 50 common formats. |
| MySQL clients (`mysql-client`) | 1 | yes | Against a local MySQL server, insert 100,000 rows with a prepared statement and read them back. |
| HTTP application servers (`http-application-servers`) | 1 | yes | Serve a fixed 1 KB response from a trivial application callback to 100,000 keep-alive requests from a local load generator. |
| Redis clients (`redis-client`) | 1 | yes | Against a local Redis server, run 100,000 SET and GET commands, both one at a time and in pipelines of 100. |
| INI and properties parsing (`ini-parsing`) | 1 | yes | Parse the same 5,000-line INI document of sections and key=value pairs, then read every value back by section and key. |
| Dotenv loading (`dotenv-loading`) | 1 | yes | Parse the same .env text of 1,000 assignments with quotes, comments and variable references into a key-value map. |
| Recursive file copying (`recursive-file-copy`) | 1 | yes | Copy a fixed directory tree of 10,000 small files in nested directories to an empty destination. |
| ZIP archiving (`zip-archiving`) | 1 | yes | Pack a fixed set of in-memory files into a deflate-compressed ZIP archive, then list and extract every entry from it. |
| Edit distance and string similarity (`edit-distance`) | 1 | yes | Compute the Levenshtein distance for 100,000 fixed pairs of strings of 5 to 200 characters. |
| MIME type lookup (`mime-type-lookup`) | 1 | yes | Look up the media type for 100,000 file names drawn from 500 distinct extensions, then the default extension for 10,000 media types. |
| HTTP cookie parsing (`cookie-parsing`) | 1 | yes | Parse 100,000 Cookie headers of 10 pairs each and 100,000 Set-Cookie headers with attributes, then serialize them back to strings. |
| Media type parsing (`media-type-parsing`) | 1 | yes | Parse and re-serialize 100,000 media type strings, half of them with charset and boundary parameters. |
| IDNA and Punycode conversion (`idna-punycode`) | 1 | yes | Convert 100,000 Unicode domain names to ASCII and back to Unicode. |
| Temporary files and directories (`temporary-files`) | 1 | yes | Create 10,000 temporary files and 1,000 temporary directories, write 1 KiB to each file and clean everything up. |
| Layered configuration loading (`layered-configuration`) | 1 | yes | Load a 1,000-key configuration from two files plus 100 environment overrides and read every key 100 times. |
| Terminal progress bars and spinners (`terminal-progress-bars`) | 1 | yes | Advance a progress bar 1,000,000 times toward a fixed total while it renders to an in-memory, non-interactive stream. |
| SQL parsing (`sql-parsing`) | 1 | yes | Parse 10,000 fixed SELECT, INSERT, UPDATE and CREATE TABLE statements of 100 to 2,000 characters. |
| JSON Patch (`json-patch`) | 1 | yes | Apply 100,000 patches of 10 operations each to a 100 KB JSON document. |
| Graph algorithms (`graph-algorithms`) | 1 | yes | Build a directed acyclic graph of 100,000 nodes and 500,000 edges, topologically sort it and find its strongly connected components. |
| Resource pools (`resource-pools`) | 1 | yes | From a pool of 10 resources, check out and return a resource 1,000,000 times across 32 concurrent callers. |
| Rate limiting (`rate-limiting`) | 1 | yes | Check 10,000,000 requests spread over 10,000 keys against a limit of 100 per second using an in-memory store. |
| gRPC (`grpc-rpc`) | 1 | yes | Make 100,000 unary calls with a 1 KB request and response, and stream 1,000,000 messages, between a client and server on the loopback interface. |

## Language-level abstractions

Trait definitions, declarative macros, error types, lazy statics, marker and wrapper types that shape code at compile time and have no standalone runtime task.

- `bitflags` #4, 2.0B in total
- `rand_core` #5, 1.8B in total
- `itertools` #13, 1.6B in total (low confidence: iterator adaptors; no standalone runtime task)
- `thiserror` #15, 1.6B in total
- `cfg-if` #16, 1.5B in total
- `serde` #19, 1.5B in total (low confidence: serialization trait framework with no standalone task)
- `once_cell` #27, 1.3B in total
- `log` #28, 1.3B in total (low confidence: logging facade without implementation)
- `digest` #40, 1.1B in total
- `pin-project-lite` #52, 1.1B in total
- `num-traits` #55, 1.1B in total
- `either` #56, 1.1B in total
- `lazy_static` #62, 1.0B in total
- `anyhow` #64, 1.0B in total
- `scopeguard` #67, 987M in total
- `futures-core` #68, 987M in total
- `zerocopy` #70, 972M in total (low confidence)
- `futures-task` #74, 967M in total
- `crypto-common` #78, 951M in total
- `generic-array` #81, 947M in total
- `typenum` #85, 935M in total
- `futures-sink` #86, 932M in total
- `http-body` #90, 921M in total
- `futures-io` #93, 888M in total
- `equivalent` #95, 880M in total
- `untrusted` #114, 815M in total (low confidence: input-parsing helper types; no standalone task)
- `memoffset` #133, 770M in total
- `zeroize` #138, 737M in total (low confidence: memory-zeroing trait)
- `subtle` #141, 731M in total
- `num-integer` #145, 719M in total
- `tower-service` #160, 676M in total
- `stable_deref_trait` #165, 660M in total
- `serde_core` #166, 649M in total
- `yoke` #177, 634M in total
- `pin-utils` #178, 633M in total
- `try-lock` #181, 625M in total (low confidence: tiny atomic lock)
- `writeable` #192, 616M in total
- `zerofrom` #200, 610M in total
- `deranged` #203, 606M in total
- `sync_wrapper` #224, 569M in total
- `tower-layer` #238, 549M in total
- `cfg_aliases` #258, 510M in total (low confidence: cfg shorthand build helper)
- `allocator-api2` #261, 509M in total
- `num-conv` #262, 507M in total
- `tokio-stream` #265, 501M in total (low confidence: stream utilities)
- `http-body-util` #266, 499M in total (low confidence: body combinators)
- `atomic-waker` #269, 493M in total (low confidence: sync primitive)
- `portable-atomic` #274, 486M in total
- `ordered-float` #279, 471M in total
- `signature` #281, 466M in total
- `static_assertions` #299, 436M in total
- `num-iter` #321, 396M in total
- `bytemuck` #322, 394M in total (low confidence: byte casting traits)
- `quick-error` #324, 392M in total
- `cipher` #327, 388M in total (low confidence: cipher trait definitions)
- `serde_with` #329, 386M in total (low confidence: serde adapter helpers)
- `dyn-clone` #344, 355M in total
- `arc-swap` #350, 347M in total (low confidence: atomically swappable Arc; no peer)
- `opaque-debug` #358, 343M in total
- `async-stream` #361, 340M in total (low confidence: async stream macro notation)
- `futures-lite` #382, 314M in total (low confidence: async combinators)
- `inout` #384, 312M in total
- `serde_path_to_error` #393, 300M in total (low confidence: serde error path wrapper)
- `valuable` #400, 297M in total (low confidence: object-safe value trait)
- `radium` #421, 278M in total
- `cast` #423, 277M in total
- `funty` #431, 272M in total
- `tap` #433, 271M in total
- `wyz` #436, 266M in total (low confidence: utility collection)
- `arrayref` #438, 265M in total
- `fallible-iterator` #442, 263M in total
- `ff` #454, 252M in total (low confidence: finite field traits)
- `elliptic-curve` #465, 247M in total (low confidence: ECC traits)
- `alloc-stdlib` #466, 246M in total (low confidence: allocator)
- `erased-serde` #468, 245M in total
- `alloc-no-stdlib` #471, 244M in total (low confidence: allocator)
- `group` #478, 241M in total
- `ed25519` #485, 238M in total (low confidence: signature type definitions)
- `ref-cast` #499, 229M in total
- `aead` #504, 228M in total
- `universal-hash` #518, 217M in total
- `serde_bytes` #526, 211M in total (low confidence: serde helper)
- `lazycell` #528, 210M in total
- `predicates-core` #543, 201M in total
- `os_str_bytes` #547, 200M in total (low confidence: platform string helpers)
- `scoped-tls` #557, 191M in total
- `io-lifetimes` #565, 188M in total
- `matches` #569, 185M in total
- `write16` #572, 183M in total (low confidence: Write-like trait)
- `unarray` #575, 180M in total
- `option-ext` #585, 177M in total
- `event-listener-strategy` #586, 177M in total (low confidence: async event-listener helper)
- `downcast-rs` #593, 175M in total
- `secrecy` #597, 173M in total
- `arbitrary` #605, 170M in total (low confidence: trait for generating structured test data)
- `ptr_meta` #617, 165M in total
- `new_debug_unreachable` #622, 164M in total
- `headers-core` #638, 160M in total
- `const_format` #646, 158M in total
- `castaway` #657, 153M in total
- `fragile` #663, 152M in total
- `crypto-mac` #692, 143M in total
- `waker-fn` #694, 142M in total
- `hybrid-array` #696, 141M in total (low confidence: array type helper)
- `rawpointer` #702, 140M in total
- `bytes-utils` #705, 139M in total (low confidence: buffer helper utilities for bytes crate)
- `outref` #709, 137M in total
- `inventory` #713, 137M in total
- `embedded-io` #717, 136M in total
- `rend` #723, 133M in total
- `maplit` #727, 133M in total
- `precomputed-hash` #729, 132M in total
- `password-hash` #735, 130M in total
- `tokio-io-timeout` #739, 129M in total (low confidence: tokio IO timeout wrappers)
- `peeking_take_while` #744, 127M in total
- `serde-value` #747, 126M in total (low confidence: serde value tree)
- `rgb` #749, 126M in total (low confidence: pixel struct types)
- `void` #750, 126M in total
- `typeid` #753, 126M in total
- `fallible-streaming-iterator` #760, 122M in total
- `value-bag` #763, 122M in total (low confidence: structured value bag)
- `downcast` #766, 121M in total
- `eyre` #769, 119M in total
- `enumflags2` #777, 118M in total
- `portable-atomic-util` #788, 116M in total
- `snafu` #792, 114M in total
- `tagptr` #806, 110M in total
- `stacker` #807, 110M in total (low confidence: stack growth helper)
- `raw-window-handle` #839, 103M in total (low confidence: trait/type definitions for window handles)
- `critical-section` #864, 99M in total
- `atomic` #869, 98M in total
- `match_cfg` #876, 97M in total
- `compression-core` #877, 96M in total (low confidence: compression trait abstractions)
- `kv-log-macro` #889, 94M in total (low confidence: logging macro)
- `triomphe` #894, 92M in total (low confidence: Arc variant)
- `cmov` #898, 91M in total (low confidence: constant-time cmov intrinsics)
- `ouroboros` #935, 85M in total
- `bytestring` #937, 85M in total (low confidence: uncertain from description)
- `serde-untagged` #998, 77M in total (low confidence: uncertain from description)

## Macro and derive support

Procedural macro and derive crates, the libraries they are built from and code generators, all of which run inside the compiler rather than in the built program.

- `syn` #2, 2.6B in total
- `quote` #8, 1.7B in total
- `proc-macro2` #9, 1.7B in total
- `thiserror-impl` #14, 1.6B in total
- `serde_derive` #23, 1.4B in total
- `tokio-macros` #104, 846M in total
- `futures-macro` #109, 832M in total
- `clap_derive` #116, 809M in total
- `rustversion` #119, 805M in total
- `tracing-attributes` #121, 791M in total
- `darling_core` #126, 776M in total
- `darling_macro` #127, 776M in total
- `darling` #128, 776M in total
- `time-macros` #143, 727M in total
- `async-trait` #153, 695M in total
- `synstructure` #158, 682M in total
- `strum_macros` #159, 677M in total
- `strum` #162, 668M in total (low confidence: derive macros plus traits for enums)
- `zerocopy-derive` #169, 644M in total
- `displaydoc` #185, 620M in total
- `yoke-derive` #191, 617M in total
- `zerovec-derive` #196, 613M in total
- `pin-project-internal` #201, 610M in total
- `pin-project` #202, 610M in total
- `prost-derive` #205, 604M in total
- `zerofrom-derive` #208, 601M in total
- `wasm-bindgen-macro` #225, 564M in total
- `wasm-bindgen-macro-support` #226, 564M in total
- `proc-macro-crate` #239, 548M in total
- `paste` #240, 545M in total
- `prettyplease` #249, 524M in total (low confidence: syn pretty-printer / code generation)
- `derive_more` #260, 509M in total
- `phf_generator` #276, 478M in total (low confidence: code generation for phf)
- `bindgen` #316, 408M in total (low confidence: FFI binding generator, runs at build time)
- `crunchy` #325, 389M in total (low confidence: loop unrolling macro)
- `serde_with_macros` #332, 380M in total
- `prost-build` #334, 376M in total
- `proc-macro-error` #349, 347M in total
- `proc-macro-error-attr` #353, 346M in total
- `async-stream-impl` #362, 340M in total
- `phf_codegen` #373, 325M in total
- `openssl-macros` #376, 322M in total
- `windows-implement` #383, 313M in total
- `wasm-bindgen-backend` #385, 312M in total
- `windows-interface` #386, 309M in total
- `pest_generator` #392, 301M in total
- `fs_extra` #395, 299M in total
- `serde_repr` #403, 294M in total
- `phf_macros` #409, 287M in total
- `derive_more-impl` #410, 286M in total
- `num_enum` #414, 282M in total
- `num_enum_derive` #415, 282M in total
- `zeroize_derive` #426, 276M in total
- `pyo3-macros` #439, 265M in total
- `pyo3-macros-backend` #440, 264M in total
- `wit-bindgen` #443, 263M in total (low confidence: bindings generator)
- `tonic-build` #460, 250M in total
- `num-derive` #472, 244M in total
- `serde_derive_internals` #482, 239M in total
- `schemars_derive` #487, 236M in total
- `overload` #497, 232M in total
- `ref-cast-impl` #500, 229M in total
- `ctor` #529, 209M in total
- `derive_builder` #535, 204M in total
- `derive_builder_core` #536, 204M in total
- `derive_builder_macro` #550, 195M in total
- `curve25519-dalek-derive` #559, 191M in total
- `derivative` #570, 185M in total
- `const-random` #583, 177M in total
- `icu_provider_macros` #588, 177M in total
- `const-random-macro` #589, 176M in total
- `mockall_derive` #603, 171M in total
- `rkyv_derive` #612, 166M in total
- `ptr_meta_derive` #618, 165M in total
- `proc-macro-hack` #620, 165M in total
- `asn1-rs-derive` #630, 163M in total
- `document-features` #631, 163M in total
- `borsh-derive` #640, 160M in total
- `serial_test_derive` #650, 157M in total
- `async-recursion` #655, 154M in total
- `bytecheck_derive` #661, 153M in total
- `litrs` #662, 152M in total (low confidence: Rust literal parser aimed at proc macros; could be standalone)
- `const_format_proc_macros` #667, 152M in total
- `bytemuck_derive` #670, 150M in total
- `asn1-rs-impl` #682, 145M in total
- `proc-macro-error-attr2` #683, 145M in total
- `proc-macro-error2` #685, 145M in total
- `enum-as-inner` #688, 143M in total
- `rusticata-macros` #693, 142M in total
- `doc-comment` #699, 140M in total
- `axum-macros` #746, 126M in total
- `derive_arbitrary` #762, 122M in total
- `rstest_macros` #770, 119M in total
- `snafu-derive` #791, 114M in total
- `seq-macro` #795, 114M in total
- `educe` #797, 113M in total
- `string_cache_codegen` #800, 112M in total
- `wit-bindgen-core` #809, 110M in total
- `wit-bindgen-rust` #810, 109M in total
- `wit-bindgen-rust-macro` #816, 108M in total
- `cbindgen` #819, 108M in total
- `typed-builder` #829, 105M in total
- `enumflags2_derive` #844, 102M in total
- `ark-ff-asm` #849, 102M in total
- `ark-ff-macros` #850, 102M in total
- `sqlx-macros` #881, 96M in total
- `chrono-tz-build` #900, 91M in total (low confidence: build script code generator)
- `zvariant_derive` #901, 91M in total
- `zbus_macros` #904, 90M in total
- `structopt-derive` #911, 90M in total
- `enum-ordinalize` #912, 90M in total
- `pastey` #921, 87M in total
- `proc-macro2-diagnostics` #923, 87M in total
- `logos-derive` #958, 81M in total
- `cxxbridge-macro` #966, 81M in total
- `ouroboros_macro` #977, 79M in total
- `cssparser-macros` #981, 79M in total
- `miette-derive` #984, 79M in total
- `typed-builder-macro` #988, 78M in total
- `hex-literal` #993, 78M in total

## System and foreign bindings

Bindings to operating system APIs, C libraries and other language runtimes, whose work is done by the code they wrap; prebuilt per-platform import libraries are out of scope.

- `getrandom` #3, 2.2B in total (low confidence: OS entropy source wrapper; no matching category)
- `libc` #7, 1.7B in total
- `windows-sys` #10, 1.7B in total
- `socket2` #31, 1.3B in total
- `rustix` #35, 1.2B in total
- `linux-raw-sys` #41, 1.1B in total
- `mio` #51, 1.1B in total (low confidence: non-blocking I/O over OS polling APIs)
- `errno` #96, 877M in total
- `nix` #103, 846M in total
- `wasi` #120, 798M in total
- `redox_syscall` #137, 759M in total
- `wasm-bindgen` #229, 563M in total
- `hermit-abi` #230, 560M in total
- `libloading` #235, 553M in total
- `js-sys` #248, 524M in total
- `winapi` #252, 516M in total
- `core-foundation` #278, 472M in total
- `openssl-sys` #280, 466M in total
- `windows-link` #282, 465M in total
- `windows-core` #284, 456M in total
- `foreign-types` #288, 449M in total
- `foreign-types-shared` #290, 449M in total
- `core-foundation-sys` #300, 434M in total
- `winapi-util` #308, 420M in total
- `openssl` #312, 415M in total
- `web-sys` #317, 404M in total
- `security-framework` #326, 389M in total
- `windows-result` #328, 387M in total
- `r-efi` #339, 363M in total
- `memmap2` #340, 362M in total
- `anstyle-wincon` #346, 353M in total (low confidence: Windows console styling support)
- `windows` #347, 350M in total
- `wasm-bindgen-futures` #348, 348M in total
- `windows-strings` #351, 347M in total
- `native-tls` #356, 344M in total (low confidence: wrapper over platform TLS)
- `quinn-udp` #370, 330M in total (low confidence: UDP socket ECN wrapper)
- `security-framework-sys` #375, 322M in total
- `clang-sys` #378, 319M in total
- `schannel` #379, 318M in total
- `android_system_properties` #394, 299M in total
- `pyo3-build-config` #425, 276M in total
- `xattr` #430, 273M in total
- `pyo3` #435, 267M in total
- `polling` #450, 255M in total (low confidence: epoll/kqueue portable interface)
- `libsqlite3-sys` #452, 254M in total
- `pyo3-ffi` #453, 253M in total
- `signal-hook` #461, 250M in total (low confidence: unix signal handling)
- `aws-lc-sys` #463, 249M in total
- `libz-sys` #481, 239M in total
- `redox_users` #491, 235M in total (low confidence: Redox OS users API)
- `winreg` #513, 220M in total
- `wasip2` #531, 208M in total
- `jni-sys` #555, 193M in total
- `system-configuration` #558, 191M in total
- `jni` #560, 191M in total
- `system-configuration-sys` #564, 189M in total
- `libredox` #598, 173M in total
- `rustls-platform-verifier` #629, 163M in total (low confidence: OS certificate verifier glue)
- `wasm-streams` #632, 162M in total (low confidence: web streams bridge via wasm)
- `inotify-sys` #666, 152M in total
- `bzip2-sys` #704, 139M in total
- `windows-registry` #710, 137M in total
- `psm` #743, 127M in total
- `objc2` #764, 122M in total
- `signal-hook-mio` #767, 120M in total
- `rusqlite` #775, 118M in total
- `git2` #776, 118M in total
- `libgit2-sys` #778, 117M in total
- `ntapi` #799, 113M in total
- `openssl-src` #815, 108M in total
- `block2` #822, 107M in total
- `tikv-jemalloc-sys` #823, 107M in total
- `windows-future` #831, 104M in total
- `windows-numerics` #835, 103M in total
- `windows-collections` #836, 103M in total
- `objc2-encode` #842, 102M in total
- `tikv-jemallocator` #852, 101M in total
- `lz4-sys` #859, 100M in total
- `windows-threading` #866, 99M in total
- `wasip3` #868, 99M in total
- `gloo-timers` #883, 95M in total
- `async-signal` #887, 94M in total (low confidence: async signal handling)
- `objc2-foundation` #896, 92M in total
- `objc2-core-foundation` #915, 89M in total
- `os_pipe` #925, 87M in total
- `crossterm_winapi` #938, 85M in total
- `serde-wasm-bindgen` #948, 83M in total
- `cxx` #967, 80M in total
- `console_error_panic_hook` #968, 80M in total (low confidence: uncertain from description)
- `procfs` #970, 80M in total (low confidence: uncertain from description)
- `secp256k1-sys` #975, 80M in total
- `core-graphics` #979, 79M in total
- `wayland-sys` #982, 79M in total

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `itoa` #22, 1.4B in total (low confidence: integer-to-string formatting; float-formatting excludes integers)
- `bytes` #48, 1.1B in total (low confidence: byte buffer types, no peer)
- `rustls` #72, 970M in total (low confidence: TLS library, no category)
- `crossbeam-utils` #76, 964M in total (low confidence: grab-bag of concurrency utilities)
- `byteorder` #106, 841M in total (low confidence: endian read/write helpers)
- `rustls-webpki` #108, 832M in total (low confidence: X.509 path verification, ASN.1 verification excluded)
- `thread_local` #142, 730M in total (low confidence: per-object thread-local storage)
- `crossbeam-epoch` #149, 704M in total (low confidence: epoch-based memory reclamation)
- `hex` #155, 690M in total (low confidence: hex encoding; base64-encoding excludes other alphabets)
- `same-file` #170, 642M in total (low confidence: file identity comparison)
- `object` #175, 636M in total (low confidence: object file format reading)
- `bumpalo` #188, 618M in total (low confidence: bump arena allocator)
- `httpdate` #211, 590M in total (low confidence: HTTP-date-only helper, excluded from date-time)
- `gimli` #215, 586M in total (low confidence: DWARF reading)
- `jobserver` #241, 544M in total (low confidence: GNU make jobserver)
- `addr2line` #246, 533M in total (low confidence: symbolication)
- `unicode-bidi` #251, 517M in total (low confidence: bidi algorithm, no category)
- `schemars` #254, 511M in total (low confidence: JSON schema generation from types)
- `backtrace` #256, 510M in total (low confidence: stack trace capture)
- `libm` #272, 490M in total (low confidence: math function library)
- `half` #273, 488M in total (low confidence: f16/bf16 types)
- `icu_locale_core` #296, 438M in total (low confidence: locale identifier handling)
- `which` #298, 436M in total (low confidence: executable PATH lookup, excluded from file-lookup)
- `unicase` #310, 417M in total (low confidence: case-insensitive string wrapper)
- `filetime` #319, 400M in total (low confidence: file timestamp accessors)
- `target-lexicon` #330, 384M in total (low confidence: target triple types)
- `num-complex` #338, 365M in total (low confidence: complex numbers, not dense linear algebra)
- `quinn-proto` #357, 344M in total (low confidence: QUIC state machine)
- `quinn` #363, 337M in total (low confidence: QUIC implementation)
- `sct` #364, 337M in total (low confidence: SCT verification)
- `constant_time_eq` #369, 330M in total (low confidence: constant-time comparison)
- `curve25519-dalek` #428, 274M in total (low confidence: group operations, not signatures)
- `camino` #429, 273M in total (low confidence: UTF-8 path types)
- `base16ct` #449, 255M in total (low confidence: constant-time hex)
- `wasmparser` #459, 251M in total (low confidence: wasm binary parsing)
- `sec1` #474, 243M in total (low confidence: EC key encoding formats)
- `cargo_metadata` #483, 239M in total (low confidence: cargo metadata output types)
- `wait-timeout` #489, 236M in total (low confidence: wait on child with timeout)
- `async-io` #498, 231M in total (low confidence: async I/O reactor and timers)
- `predicates` #510, 225M in total (low confidence: boolean predicate functions)
- `anes` #511, 225M in total (low confidence: ANSI escape sequence provider and parser)
- `toml_writer` #522, 215M in total (low confidence: TOML writing; toml-parsing covers parsing only)
- `futures-timer` #524, 214M in total (low confidence: future timeouts)
- `block-padding` #530, 209M in total (low confidence: block padding schemes)
- `termtree` #537, 203M in total (low confidence: tree visualization output)
- `crossterm` #539, 202M in total (low confidence: terminal control and input events)
- `unicode-properties` #541, 201M in total (low confidence: unicode property queries)
- `predicates-tree` #545, 201M in total (low confidence: Renders predicate results as a tree; no peers)
- `async-task` #549, 198M in total (low confidence: Executor task building block; no matching category)
- `wasm-encoder` #553, 193M in total (low confidence: WebAssembly binary encoder; no peers)
- `float-cmp` #584, 177M in total (low confidence: Approximate float comparison; see approx)
- `string_cache` #594, 175M in total (low confidence: String interning; small-strings excludes interning)
- `approx` #614, 166M in total (low confidence: Approximate float comparison; see float-cmp)
- `headers` #628, 163M in total (low confidence: Typed HTTP header collection; no peers)
- `rand_distr` #634, 161M in total (low confidence: Statistical distributions are excluded from random-number-generation)
- `stringprep` #647, 158M in total (low confidence: stringprep profiles excluded from unicode-normalization)
- `codespan-reporting` #674, 148M in total (low confidence: Diagnostic reporting; see miette)
- `bs58` #687, 144M in total (low confidence: Base58 is out of scope for base64-encoding)
- `fiat-crypto` #690, 143M in total (low confidence: Generated field arithmetic for crypto; unclear peers)
- `assert-json-diff` #700, 140M in total (low confidence: JSON assertion diff with output; text-diff excludes assertion printers)
- `webpki` #718, 135M in total (low confidence: X.509 certificate verification; excluded from asn1-der-decoding)
- `remove_dir_all` #732, 131M in total (low confidence: Recursive directory removal; no peers)
- `ctrlc` #734, 130M in total (low confidence: Signal handler; no peers)
- `fs-err` #737, 130M in total (low confidence: std::fs wrapper with better errors; no peers)
- `color_quant` #756, 124M in total (low confidence: Color quantization; no peers)
- `lexical-write-integer` #783, 117M in total (low confidence: Integer formatting; excluded from float-formatting)
- `ascii` #785, 117M in total (low confidence: ASCII-only string types; no peers)
- `multer` #790, 115M in total (low confidence: multipart/form-data parser; excluded from query-string-parsing)
- `widestring` #817, 108M in total (low confidence: Wide string types for FFI; no peers)
- `indenter` #821, 107M in total (low confidence: Adds indentation to formatter output; indentation stripping is the reverse)
- `rcgen` #826, 106M in total (low confidence: X.509 certificate generation; no peers)
- `ttf-parser` #827, 105M in total (low confidence: Font parsing; no peers)
- `resolv-conf` #834, 104M in total (low confidence: resolv.conf parser; no peers)
- `http-range-header` #838, 103M in total (low confidence: Single header parser; excluded from http-message-parsing)
- `normalize-line-endings` #855, 100M in total (low confidence: Line ending normalization; no peers)
- `smawk` #863, 99M in total (low confidence: Row minima in monotone matrices; no peers)
- `zbus` #905, 90M in total (low confidence: D-Bus client; no peers)
- `arrow-ipc` #906, 90M in total (low confidence: Columnar data format; excluded from binary-serialization)
- `moxcms` #910, 90M in total (low confidence: ICC color management; css-color-parsing covers CSS strings only)
- `language-tags` #914, 90M in total (low confidence: Language tag parsing; no peers)
- `parse-zoneinfo` #920, 88M in total (low confidence: Time zone database parser; excluded from date-time)
- `byteorder-lite` #928, 86M in total (low confidence: Endian read/write helpers; see scroll)
- `dialoguer` #929, 86M in total (low confidence: Interactive terminal prompts; no peers)
- `ctutils` #939, 85M in total (low confidence: Constant-time utilities; no peers)
- `parquet` #956, 81M in total (low confidence: Parquet file format; file-format readers excluded from dataframes)
- `logos` #957, 81M in total (low confidence: Lexer generator; lexer-only generators excluded from parser-combinators)
- `scroll` #961, 81M in total (low confidence: Endian-aware read/write traits; see byteorder-lite)
- `miette` #978, 79M in total (low confidence: Diagnostic reporting; see codespan-reporting)
- `simba` #980, 79M in total (low confidence: SIMD algebra abstractions; no peers)
- `sdd` #983, 79M in total (low confidence: Lock-free memory reclamation; no peers)
- `vte` #992, 78M in total (low confidence: Terminal escape sequence parser; no peers)
- `ena` #994, 78M in total (low confidence: Union-find and unification; no peers)
- `x25519-dalek` #996, 77M in total (low confidence: Diffie-Hellman key exchange; excluded from digital-signatures)

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `regex-syntax` #17, 1.5B in total
- `block-buffer` #43, 1.1B in total
- `http` #54, 1.1B in total (low confidence: HTTP request/response type definitions)
- `lock_api` #59, 1.0B in total
- `ppv-lite86` #83, 937M in total
- `clap_lex` #88, 929M in total
- `tracing-core` #91, 914M in total
- `toml_datetime` #101, 850M in total
- `futures-executor` #125, 789M in total (low confidence: executor part of futures)
- `signal-hook-registry` #130, 772M in total
- `anstyle-parse` #146, 717M in total
- `time-core` #154, 691M in total
- `tinyvec_macros` #156, 687M in total
- `want` #163, 667M in total (low confidence: tiny helper for hyper/futures)
- `utf8parse` #167, 648M in total
- `phf_shared` #174, 636M in total
- `zerovec` #187, 618M in total (low confidence: zero-copy vector for ICU4X)
- `icu_provider` #189, 618M in total
- `serde_spanned` #193, 616M in total
- `icu_collections` #197, 612M in total
- `powerfmt` #221, 578M in total (low confidence: formatting helper for the time crate)
- `rayon-core` #223, 569M in total
- `wasm-bindgen-shared` #227, 564M in total
- `rustls-pki-types` #236, 551M in total (low confidence: shared PKI types)
- `hyper-util` #250, 518M in total (low confidence: utilities for hyper)
- `axum-core` #268, 497M in total
- `idna_adapter` #283, 460M in total
- `potential_utf` #297, 436M in total (low confidence: ICU helper types)
- `pest_meta` #390, 301M in total
- `tracing-serde` #407, 289M in total
- `criterion-plot` #418, 281M in total (low confidence: plotting helper for criterion)
- `ciborium-io` #455, 252M in total
- `ciborium-ll` #457, 252M in total
- `cargo-platform` #476, 242M in total (low confidence: cargo helper)
- `plotters-backend` #492, 235M in total
- `plotters-svg` #494, 235M in total
- `rfc6979` #496, 234M in total (low confidence: deterministic nonce helper for ECDSA)
- `vsimd` #639, 160M in total
- `sqlx-core` #643, 158M in total
- `bytecheck` #660, 153M in total (low confidence: validation companion to rkyv)
- `primeorder` #714, 137M in total (low confidence: elliptic curve arithmetic building block)
- `android-tzdata` #721, 134M in total (low confidence: android tzdata parser)
- `lexical-util` #724, 133M in total
- `jiff-static` #733, 131M in total
- `deadpool-runtime` #752, 126M in total
- `zune-core` #768, 119M in total
- `markup5ever` #787, 116M in total
- `arrow-buffer` #841, 102M in total
- `arrow-schema` #846, 102M in total
- `arrow-array` #847, 102M in total
- `ark-serialize` #848, 102M in total (low confidence: arkworks serialization helper)
- `wit-bindgen-rt` #853, 101M in total
- `arrow-data` #854, 101M in total
- `arrow-select` #865, 99M in total
- `arrow-cast` #875, 97M in total
- `metrics-util` #878, 96M in total
- `lalrpop-util` #918, 88M in total (low confidence: runtime for LALRPOP-generated parsers)
- `zbus_names` #927, 86M in total
- `arrow-ord` #947, 83M in total
- `arrow-arith` #949, 83M in total
- `zvariant_utils` #950, 82M in total
- `arrow-string` #951, 82M in total
- `arrow-row` #959, 81M in total
- `actix-server` #963, 81M in total (low confidence: uncertain from description)
- `actix-codec` #964, 81M in total
- `actix-utils` #973, 80M in total
- `actix-service` #974, 80M in total
- `cxxbridge-flags` #976, 80M in total

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `opentelemetry` #422, 278M in total
- `opentelemetry_sdk` #493, 235M in total
- `tracing-opentelemetry` #520, 216M in total
- `aws-smithy-http` #609, 168M in total
- `opentelemetry-otlp` #636, 161M in total
- `aws-smithy-json` #642, 159M in total
- `opentelemetry-http` #656, 153M in total
- `tracing-futures` #678, 146M in total (low confidence: tracing instrumentation for futures)
- `debugid` #680, 146M in total (low confidence: Sentry protocol types)
- `aws-smithy-types` #689, 143M in total
- `opentelemetry-semantic-conventions` #691, 143M in total
- `aws-sigv4` #697, 141M in total
- `aws-smithy-async` #698, 141M in total
- `aws-types` #703, 139M in total
- `aws-smithy-xml` #715, 136M in total
- `aws-sdk-sts` #722, 133M in total
- `aws-credential-types` #728, 132M in total
- `aws-config` #730, 132M in total
- `aws-smithy-runtime-api` #738, 129M in total
- `aws-smithy-query` #741, 128M in total
- `aws-smithy-runtime` #745, 127M in total
- `aws-runtime` #751, 126M in total
- `aws-sdk-sso` #780, 117M in total
- `aws-sdk-ssooidc` #843, 102M in total
- `aws-smithy-eventstream` #861, 100M in total
- `aws-sdk-s3` #892, 93M in total
- `object_store` #895, 92M in total (low confidence: multi-cloud object storage interface)
- `aws-smithy-http-client` #903, 91M in total
- `aws-smithy-checksums` #908, 90M in total
- `kube` #991, 78M in total
- `kube-core` #997, 77M in total
- `kube-client` #1000, 77M in total

## Environment detection

One-shot probes of the host such as CPU count and features, terminal state, user, host name, time zone and standard directories, which return in constant time and have no workload to scale.

- `cpufeatures` #63, 1.0B in total
- `rustc_version` #131, 771M in total (low confidence: probes rustc version at build time)
- `iana-time-zone` #148, 707M in total
- `colorchoice` #150, 700M in total (low confidence: global color control switch)
- `anstyle-query` #151, 699M in total
- `num_cpus` #195, 613M in total
- `openssl-probe` #199, 611M in total
- `rustls-native-certs` #217, 582M in total (low confidence: loads platform cert store; weak fit)
- `is_terminal_polyfill` #286, 451M in total
- `home` #294, 440M in total
- `atty` #342, 356M in total
- `dirs-sys` #345, 355M in total
- `is-terminal` #365, 337M in total
- `dirs` #380, 317M in total
- `iana-time-zone-haiku` #391, 301M in total
- `num_threads` #488, 236M in total
- `whoami` #505, 228M in total
- `hostname` #516, 218M in total
- `terminal_size` #521, 216M in total
- `sysinfo` #523, 214M in total
- `dirs-sys-next` #567, 187M in total
- `raw-cpuid` #574, 180M in total
- `dirs-next` #615, 165M in total
- `quanta` #665, 152M in total (low confidence: clock/timing source)
- `etcetera` #798, 113M in total
- `gethostname` #857, 100M in total

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `autocfg` #25, 1.4B in total
- `cc` #30, 1.3B in total
- `version_check` #53, 1.1B in total
- `pkg-config` #123, 790M in total
- `find-msvc-tools` #253, 512M in total (low confidence: build-script helper)
- `vcpkg` #277, 474M in total
- `cmake` #377, 321M in total
- `criterion` #398, 298M in total
- `proptest` #546, 200M in total
- `mockall` #602, 172M in total (low confidence: test mocking library)
- `serial_test` #644, 158M in total
- `rusty-fork` #648, 157M in total
- `wit-parser` #701, 140M in total (low confidence: wit parsing tooling, unclear fit)
- `rstest` #754, 126M in total
- `wasm-metadata` #772, 118M in total (low confidence: wasm metadata tooling)
- `wit-component` #774, 118M in total
- `insta` #824, 107M in total
- `tokio-test` #867, 99M in total
- `assert_cmd` #916, 89M in total (low confidence: CLI test assertion helper)
- `wiremock` #941, 84M in total (low confidence: HTTP mocking for tests)

## Binary serialization

Encode structured values to a compact binary format and decode them back, such as Protocol Buffers, MessagePack, CBOR and bincode; text formats, columnar data and byte-order helpers are out of scope.

- `prost` #190, 618M in total
- `bincode` #367, 334M in total
- `ciborium` #456, 252M in total
- `borsh` #542, 201M in total
- `protobuf` #568, 185M in total
- `rkyv` #613, 166M in total
- `rmp` #686, 144M in total
- `rmp-serde` #712, 137M in total
- `leb128fmt` #794, 114M in total (low confidence: LEB128 integer codec only; nearest category)
- `flatbuffers` #814, 108M in total
- `integer-encoding` #870, 98M in total (low confidence: varint/zigzag integer encoding)
- `thrift` #873, 97M in total
- `zvariant` #902, 91M in total (low confidence: D-Bus/GVariant wire encoding)
- `serde_cbor` #932, 85M in total
- `prost-reflect` #985, 79M in total (low confidence: uncertain from description)

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `unicode-ident` #20, 1.5B in total (low confidence: Unicode XID property tables)
- `webpki-roots` #124, 789M in total
- `unicode-xid` #176, 635M in total (low confidence: Unicode property lookup tables)
- `icu_properties_data` #183, 622M in total
- `icu_properties` #194, 614M in total (low confidence: Unicode property data/lookups for ICU4X)
- `icu_normalizer_data` #198, 611M in total
- `ucd-trie` #389, 306M in total (low confidence: Unicode codepoint trie tables)
- `icu_locid_transform_data` #579, 179M in total
- `crc-catalog` #587, 177M in total
- `chrono-tz` #624, 164M in total (low confidence: IANA tz database tables; date-time excludes tz databases)
- `oid-registry` #711, 137M in total
- `webpki-root-certs` #820, 107M in total
- `unicode_categories` #830, 104M in total (low confidence: unicode category tables)

## Platform-specific binaries

Packages that only carry a prebuilt native executable or addon for one OS and CPU architecture.

- `windows_x86_64_msvc` #39, 1.2B in total
- `windows_x86_64_gnu` #45, 1.1B in total
- `windows_i686_msvc` #46, 1.1B in total
- `windows_aarch64_msvc` #47, 1.1B in total
- `windows_i686_gnu` #49, 1.1B in total
- `windows-targets` #50, 1.1B in total
- `windows_aarch64_gnullvm` #57, 1.1B in total
- `windows_x86_64_gnullvm` #58, 1.1B in total
- `windows_i686_gnullvm` #206, 603M in total
- `winapi-x86_64-pc-windows-gnu` #311, 416M in total
- `winapi-i686-pc-windows-gnu` #313, 414M in total

## Non-cryptographic hashing

Fast hash functions for hash tables and fingerprints, such as FNV, xxHash, SipHash and Murmur; cryptographic digests and error-detecting checksums are out of scope.

- `rustc-hash` #110, 830M in total
- `fnv` #112, 829M in total
- `ahash` #117, 806M in total
- `foldhash` #171, 638M in total
- `siphasher` #220, 578M in total
- `twox-hash` #448, 257M in total
- `hash32` #611, 166M in total
- `seahash` #653, 156M in total
- `fxhash` #684, 145M in total
- `xxhash-rust` #801, 112M in total
- `nohash-hasher` #962, 81M in total (low confidence: identity hasher that does not hash)

## Cryptographic hashing

Compute cryptographic message digests such as SHA-1, SHA-2, SHA-3, BLAKE and MD5; HMAC, key derivation, password hashing and non-cryptographic hashes are out of scope.

- `sha2` #65, 1.0B in total
- `sha1` #231, 558M in total
- `md-5` #331, 381M in total
- `tiny-keccak` #469, 245M in total
- `blake3` #554, 193M in total
- `sha3` #578, 179M in total
- `blake2` #591, 175M in total
- `keccak` #621, 165M in total
- `sha1_smol` #623, 164M in total
- `sha-1` #635, 161M in total
- `md5` #677, 146M in total

## Non-deflate compression

Compress and decompress byte buffers with a codec other than deflate, such as Zstandard, Brotli, LZ4, Snappy or bzip2; deflate, zlib and gzip framing and archive formats are out of scope.

- `zstd-safe` #309, 420M in total
- `zstd` #315, 411M in total
- `zstd-sys` #333, 379M in total (low confidence: raw FFI to zstd)
- `brotli-decompressor` #419, 281M in total
- `brotli` #427, 275M in total
- `bzip2` #599, 173M in total
- `lz4_flex` #676, 147M in total
- `weezl` #771, 119M in total
- `snap` #793, 114M in total
- `compression-codecs` #872, 98M in total (low confidence: adaptors over several codecs)
- `lz4` #989, 78M in total

## Message channels

In-process queues that pass values between threads or async tasks with send and receive ends; event emitters, OS pipes and network sockets are out of scope.

- `futures-channel` #87, 930M in total
- `crossbeam-channel` #182, 624M in total
- `crossbeam-queue` #335, 373M in total
- `async-channel` #355, 345M in total
- `concurrent-queue` #372, 328M in total
- `flume` #490, 236M in total
- `futures-intrusive` #637, 161M in total (low confidence: async sync primitives and channels)
- `crossbeam` #681, 145M in total (low confidence: umbrella of concurrency tools including channels)
- `piper` #719, 134M in total (low confidence: async SPSC byte pipe)
- `async-broadcast` #818, 108M in total

## ASN.1 DER decoding

Parse and encode ASN.1 structures in BER or DER, including X.509 certificates; PEM text framing, certificate chain verification and TLS are out of scope.

- `const-oid` #263, 504M in total (low confidence: OID type with DER encoding)
- `der` #271, 490M in total
- `spki` #289, 449M in total (low confidence: X.509 SPKI types)
- `pkcs8` #301, 432M in total (low confidence: PKCS#8 key syntax layered on DER; not a general ASN.1 decoder)
- `pkcs1` #508, 227M in total (low confidence: PKCS#1 key encoding, DER-based)
- `simple_asn1` #573, 183M in total
- `x509-parser` #590, 176M in total
- `der-parser` #610, 167M in total
- `asn1-rs` #625, 164M in total
- `yasna` #813, 108M in total

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `anstyle` #122, 791M in total (low confidence: ANSI style types rather than string wrapping)
- `nu-ansi-term` #232, 558M in total
- `termcolor` #247, 528M in total
- `console` #337, 368M in total (low confidence: terminal abstraction incl. colors; not purely styling)
- `yansi` #432, 272M in total
- `colored` #484, 238M in total
- `ansi_term` #507, 227M in total
- `owo-colors` #596, 174M in total
- `term` #654, 154M in total (low confidence: terminal formatting library; unsure of exact scope)

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `num-bigint` #180, 626M in total
- `num-rational` #318, 403M in total (low confidence: rational number type, closest to fraction.js)
- `crypto-bigint` #404, 294M in total
- `num` #406, 293M in total (low confidence: umbrella numeric types crate)
- `num-bigint-dig` #533, 207M in total
- `rust_decimal` #664, 152M in total
- `bigdecimal` #755, 125M in total
- `ark-ff` #851, 101M in total (low confidence: Finite field arithmetic; nearest category)
- `fraction` #934, 85M in total

## Hash maps

General-purpose in-memory key-value hash tables, including insertion-ordered and concurrent variants; bounded caches, tries, slabs and the hash functions themselves are out of scope.

- `hashbrown` #1, 2.6B in total
- `indexmap` #12, 1.6B in total
- `phf` #213, 588M in total (low confidence: compile-time perfect hash maps; lookup-only)
- `dashmap` #320, 398M in total
- `hashlink` #341, 361M in total
- `linked-hash-map` #381, 315M in total
- `multimap` #411, 285M in total
- `vec_map` #577, 179M in total (low confidence: vector-backed small-integer-key map)
- `ordered-multimap` #860, 100M in total (low confidence: insertion-ordered multimap)

## Random number generation

Pseudo-random number generators that produce integers, floats and byte fills from a seed; OS entropy sources, random ID strings and statistical distributions are out of scope.

- `rand` #6, 1.8B in total
- `rand_chacha` #21, 1.5B in total
- `fastrand` #79, 951M in total
- `rand_xorshift` #412, 285M in total
- `oorandom` #444, 262M in total
- `rand_pcg` #548, 198M in total
- `rand_hc` #582, 177M in total
- `rand_xoshiro` #720, 134M in total
- `nanorand` #987, 79M in total

## Framework and tool extensions

Plugins, engines, adapters, middleware and asset bundles that only work inside one host framework or tool, such as Rails engines, Rack middleware, OmniAuth strategies, Faraday adapters and Fluentd or Logstash plugins; the host frameworks themselves and build or test tooling plugins are out of scope.

- `tokio-rustls` #115, 813M in total (low confidence: TLS adapter for tokio)
- `hyper-rustls` #157, 682M in total
- `tracing-log` #218, 581M in total (low confidence: adapter between tracing and log)
- `tower-http` #267, 498M in total
- `hyper-tls` #343, 356M in total
- `hyper-timeout` #352, 346M in total
- `tokio-native-tls` #399, 297M in total (low confidence: TLS stream adapter for tokio)
- `clap_complete` #765, 121M in total (low confidence: clap shell completion generator)
- `reqwest-middleware` #955, 81M in total (low confidence: uncertain from description)

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `tokio` #61, 1.0B in total
- `futures-util` #71, 971M in total (low confidence: extension traits and combinators for futures)
- `futures` #111, 829M in total (low confidence: broad futures/streams library)
- `tokio-util` #113, 823M in total (low confidence: grab-bag of tokio utilities)
- `tower` #147, 708M in total (low confidence: service middleware framework)
- `async-std` #880, 96M in total
- `actix-rt` #930, 86M in total (low confidence: uncertain from description)

## Checksums

Compute error-detecting checksums such as CRC-32, CRC-32C and Adler-32 over byte buffers; cryptographic digests and hash-table hashes are out of scope.

- `crc32fast` #139, 732M in total
- `adler2` #242, 541M in total
- `simd-adler32` #307, 423M in total
- `crc` #397, 299M in total
- `adler` #413, 283M in total
- `adler32` #862, 99M in total
- `crc32c` #953, 82M in total

## Digital signatures

Generate key pairs, sign messages and verify signatures with ECDSA, Ed25519 or RSA; signature trait definitions, JWT framing and certificate handling are out of scope.

- `ecdsa` #477, 241M in total
- `rsa` #495, 235M in total
- `ed25519-dalek` #509, 226M in total
- `p256` #561, 191M in total
- `p384` #886, 95M in total
- `secp256k1` #936, 85M in total
- `k256` #952, 82M in total

## Deflate compression

Compress and decompress byte buffers with deflate, zlib or gzip framing; archive formats and string-oriented LZ codecs are out of scope.

- `miniz_oxide` #84, 937M in total
- `flate2` #144, 726M in total
- `async-compression` #506, 227M in total (low confidence: async adaptors over several codecs)
- `fdeflate` #592, 175M in total
- `zlib-rs` #633, 162M in total
- `zopfli` #736, 130M in total

## Single-format image codecs

Decode one raster image format such as PNG, JPEG, GIF, TIFF or WebP to a pixel buffer, and encode pixels back where supported; multi-format image toolkits with resize and crop operations and header-only size readers are out of scope.

- `png` #475, 242M in total
- `gif` #706, 138M in total
- `zune-jpeg` #761, 122M in total
- `tiff` #796, 114M in total
- `jpeg-decoder` #907, 90M in total
- `image-webp` #990, 78M in total

## Synchronization primitives

In-process mutexes, read-write locks, condition variables, spin locks and thread parking that guard shared state between threads or tasks; cross-process file locks, message channels and distributed locks are out of scope.

- `parking_lot_core` #38, 1.2B in total
- `parking_lot` #42, 1.1B in total
- `spin` #152, 695M in total
- `event-listener` #228, 563M in total (low confidence: async notification primitive)
- `parking` #416, 282M in total
- `async-lock` #424, 277M in total

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `clap` #36, 1.2B in total
- `clap_builder` #118, 806M in total
- `getopts` #658, 153M in total
- `structopt` #909, 90M in total
- `pico-args` #999, 77M in total

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `serde_yaml` #305, 425M in total
- `unsafe-libyaml` #387, 306M in total
- `yaml-rust` #562, 191M in total
- `ron` #784, 117M in total (low confidence: RON is not a JSON superset; nearest category)
- `json5` #969, 80M in total

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `quick-xml` #291, 448M in total
- `xml-rs` #669, 151M in total
- `html5ever` #782, 117M in total
- `xmlparser` #789, 115M in total
- `roxmltree` #971, 80M in total

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `rayon` #219, 580M in total (low confidence: data-parallel work-stealing; imperfect fit)
- `blocking` #576, 179M in total (low confidence: thread pool for blocking calls)
- `async-executor` #600, 172M in total (low confidence: async task executor)
- `threadpool` #731, 132M in total
- `async-global-executor` #897, 92M in total (low confidence: global async executor)

## Float to string formatting

Convert floating-point numbers to their shortest round-trip decimal string; integer formatting, number parsing and locale-aware formatting are out of scope.

- `ryu` #37, 1.2B in total
- `zmij` #270, 492M in total
- `lexical-core` #645, 158M in total
- `dtoa` #652, 156M in total
- `lexical-write-float` #781, 117M in total

## Regular expression matching

Compile regular expressions and search text with them; regex syntax parsers on their own, glob matching and literal substring search are out of scope.

- `regex-automata` #29, 1.3B in total
- `regex` #33, 1.2B in total
- `matchers` #259, 510M in total (low confidence: regex matching on streams)
- `fancy-regex` #473, 243M in total
- `regex-lite` #551, 194M in total

## UTF-8 validation and decoding

Validate that a byte buffer is well-formed UTF-8 and decode it to code points, including incremental and lossy decoding; transcoding legacy character sets and Unicode normalization are out of scope.

- `utf8_iter` #255, 511M in total
- `bstr` #306, 424M in total (low confidence: byte string type with UTF-8 handling)
- `simdutf8` #486, 236M in total
- `utf-8` #503, 228M in total
- `encode_unicode` #540, 202M in total (low confidence: UTF-8/UTF-16 char types)

## Unauthenticated symmetric ciphers

Encrypt and decrypt bytes with a bare block or stream cipher and its mode of operation, such as AES-CTR, AES-CBC, ChaCha20 or Salsa20; authenticated AEAD constructions, public-key cryptography and TLS are out of scope.

- `aes` #360, 341M in total
- `chacha20` #451, 254M in total
- `ctr` #515, 218M in total
- `cbc` #804, 111M in total
- `salsa20` #919, 88M in total

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `instant` #368, 334M in total
- `web-time` #464, 249M in total
- `once_cell_polyfill` #641, 159M in total
- `ark-std` #899, 91M in total

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `hyper` #69, 974M in total (low confidence: HTTP client and server library)
- `h2` #98, 856M in total (low confidence: HTTP/2 protocol implementation; could issue GET requests but is a low-level protocol crate)
- `reqwest` #134, 767M in total
- `ureq` #517, 218M in total

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `axum` #264, 502M in total
- `matchit` #287, 451M in total (low confidence: URL router only)
- `actix-web` #945, 84M in total
- `actix-router` #972, 80M in total

## LRU caches

Bounded in-memory key-value caches that evict the least recently used entry; unbounded maps, memoization decorators and remote cache clients are out of scope.

- `lru` #336, 370M in total
- `lru-slab` #512, 225M in total (low confidence: slab with LRU tracking, not a bounded cache)
- `moka` #716, 136M in total
- `lru-cache` #926, 86M in total

## Bit sets

Compact collections of bits with set, test and bulk boolean operations; flag-enum macros and compressed bitmaps for serialization are out of scope.

- `fixedbitset` #257, 510M in total
- `bit-vec` #304, 426M in total
- `bit-set` #323, 393M in total
- `bitvec` #405, 293M in total

## Inline small vectors

Growable sequences that store their elements inline or on the stack up to a fixed capacity; heap-only vectors, small-string types and arenas are out of scope.

- `smallvec` #32, 1.3B in total
- `tinyvec` #132, 771M in total
- `arrayvec` #212, 588M in total
- `heapless` #671, 150M in total

## Base64 encoding

Encode bytes to base64 text and decode them back; hexadecimal, base58 and other alphabets, and PEM framing are out of scope.

- `base64` #11, 1.7B in total
- `data-encoding` #293, 444M in total
- `base64ct` #302, 427M in total
- `base64-simd` #651, 156M in total

## Parser combinators and generators

Libraries for writing a parser for an arbitrary grammar from combinators or a grammar definition; parsers for one fixed format and lexer-only generators are out of scope.

- `winnow` #77, 954M in total
- `nom` #135, 762M in total
- `pest` #354, 346M in total
- `combine` #437, 266M in total

## TOML parsing

Parse TOML text into values or a document tree; JSON-superset formats such as YAML and JSON5, INI files and layered configuration loaders are out of scope.

- `toml` #73, 967M in total
- `toml_edit` #97, 870M in total
- `toml_parser` #374, 323M in total
- `toml_write` #601, 172M in total (low confidence: Writes TOML rather than parsing; nearest category)

## Authenticated encryption

Encrypt and decrypt byte buffers with an AEAD cipher such as AES-GCM or ChaCha20-Poly1305; bare block and stream ciphers, TLS and public-key cryptography are out of scope.

- `ring` #129, 775M in total (low confidence: broad crypto library; ring is listed as example)
- `aws-lc-rs` #479, 241M in total
- `aes-gcm` #607, 169M in total
- `chacha20poly1305` #913, 90M in total

## Date and time

Parse, format and do calendar arithmetic on dates, times and durations; time zone database packages, HTTP-date-only helpers and clock sources are out of scope.

- `time` #82, 945M in total
- `chrono` #99, 855M in total
- `humantime` #285, 454M in total (low confidence: duration/time parse and format)
- `jiff` #525, 211M in total

## Identifier case conversion

Convert strings between naming conventions such as camelCase, snake_case and kebab-case; Unicode case folding and case-insensitive comparison are out of scope.

- `heck` #26, 1.4B in total
- `convert_case` #244, 539M in total
- `ident_case` #303, 426M in total
- `Inflector` #779, 117M in total

## Structured logging

Application loggers that format records with levels and key-value fields, as JSON or colored text, and write them to a sink; environment-switched debug loggers, telemetry exporters and vendor log shippers are out of scope.

- `tracing` #92, 903M in total (low confidence: application-level tracing/spans with logging)
- `tracing-subscriber` #168, 646M in total (low confidence: tracing subscribers; not exactly a logger but closest)
- `tracing-appender` #758, 123M in total (low confidence: file appender for tracing)
- `slog` #986, 79M in total

## Number parsing

Parse decimal text into integer and floating-point machine numbers; formatting numbers as text, arbitrary-precision arithmetic and locale-aware or spelled-out numbers are out of scope.

- `minimal-lexical` #234, 554M in total
- `atoi` #544, 201M in total
- `lexical-parse-float` #725, 133M in total
- `lexical-parse-integer` #726, 133M in total

## Message authentication codes

Compute a keyed authentication tag over a message with HMAC or a universal hash such as Poly1305, GHASH or POLYVAL; unkeyed digests, full AEAD ciphers and digital signatures are out of scope.

- `hmac` #184, 621M in total
- `polyval` #566, 188M in total
- `ghash` #604, 171M in total
- `poly1305` #828, 105M in total

## Linear algebra and arrays

Dense vector, matrix and n-dimensional array types with element-wise arithmetic, matrix multiplication and decompositions; dataframes, arbitrary-precision numbers and machine learning frameworks are out of scope.

- `glam` #672, 149M in total
- `matrixmultiply` #673, 148M in total
- `ndarray` #742, 128M in total
- `nalgebra` #890, 93M in total

## Slabs and slot maps

Containers that store values of one type in reusable slots and hand back a stable integer key or handle for each; hash tables with caller-chosen keys, bump allocators without removal and inline vectors are out of scope.

- `slab` #75, 967M in total
- `sharded-slab` #243, 540M in total
- `id-arena` #708, 137M in total
- `slotmap` #805, 111M in total

## Small-string types

String types that store short contents inline without a heap allocation and are cheap to clone; inline vectors of arbitrary elements, string interning tables and byte-string types without the inline optimization are out of scope.

- `tinystr` #179, 629M in total
- `compact_str` #608, 169M in total
- `smol_str` #748, 126M in total
- `tendril` #845, 102M in total

## Text diffing

Compute the line or element differences between two texts or sequences; edit-distance scores, assertion pretty-printers and structured JSON patches are out of scope.

- `diff` #514, 219M in total
- `similar` #527, 210M in total
- `difflib` #707, 138M in total

## Retry policies

Re-run a failing function according to a policy of attempts, backoff and jitter, or guard it with a circuit breaker; rate limiters, task queues and HTTP-client-specific transports are out of scope.

- `backoff` #856, 100M in total
- `tokio-retry` #871, 98M in total
- `backon` #943, 84M in total

## PostgreSQL clients

Speak the PostgreSQL wire protocol to run queries and decode result rows; ORMs, query builders, connection-pool add-ons and drivers for other databases are out of scope.

- `sqlx` #649, 157M in total (low confidence: multi-database SQL toolkit; could run Postgres benchmark)
- `sqlx-postgres` #933, 85M in total
- `postgres-protocol` #995, 78M in total (low confidence: low-level protocol crate)

## Sorted maps and prefix trees

Mutable in-memory key-value containers that keep keys in sorted order, such as B-trees, radix trees and skip lists, and support ordered, range or prefix iteration; hash tables, persistent immutable variants, bounded caches and on-disk stores are out of scope.

- `litemap` #186, 619M in total (low confidence: flat sorted-Vec map, not tree-based)
- `zerotrie` #292, 446M in total (low confidence: string-to-int trie)
- `radix_trie` #917, 88M in total

## Query string parsing

Decode URL query strings or application/x-www-form-urlencoded bodies into key-value structures and encode them back; parsing the rest of the URL and multipart form bodies are out of scope.

- `form_urlencoded` #105, 845M in total
- `serde_urlencoded` #210, 595M in total
- `serde_qs` #885, 95M in total

## Path string manipulation

Normalize, join, split and relativize file system path strings purely in memory, including separator conversion between platforms; touching the file system, glob matching and URL parsing are out of scope.

- `dunce` #388, 306M in total (low confidence: Windows path normalization, touches fs for canonicalize)
- `pathdiff` #563, 190M in total
- `relative-path` #812, 108M in total

## PEM encoding

Decode PEM text blocks into their label and binary payload and encode payloads back into PEM; parsing the ASN.1 structures inside, certificate verification and bare base64 are out of scope.

- `rustls-pemfile` #237, 549M in total
- `pem-rfc7468` #359, 343M in total
- `pem` #441, 263M in total

## Substring search

Find the occurrences of one or many literal byte or string patterns in a large buffer; regular expression engines, fuzzy matching and full-text indexing are out of scope.

- `memchr` #18, 1.5B in total
- `aho-corasick` #34, 1.2B in total
- `bytecount` #675, 148M in total

## Character set transcoding

Decode bytes in a legacy character encoding such as Shift_JIS, GBK or windows-1252 to Unicode text and encode text back; guessing an unknown encoding, base64 and UTF-8 validation alone are out of scope.

- `encoding_rs` #233, 554M in total
- `utf16_iter` #580, 178M in total (low confidence: Iterates chars over UTF-16; nearest is encoding conversion)
- `cesu8` #837, 103M in total (low confidence: CESU-8 conversion; nearest category)

## Filesystem globbing

Expand glob patterns into the list of matching paths by walking the filesystem; in-memory pattern matching and unfiltered directory crawling are out of scope.

- `glob` #172, 637M in total
- `globwalk` #944, 84M in total

## Directory walking

Recursively enumerate every file and directory under a root; glob pattern expansion and file watching are out of scope.

- `walkdir` #164, 664M in total
- `ignore` #571, 184M in total (low confidence: gitignore-aware directory walker)

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `url` #89, 924M in total
- `iri-string` #552, 194M in total

## Indentation stripping

Remove common leading whitespace from multi-line strings; adding indentation, word wrapping and code formatting are out of scope.

- `indoc` #366, 335M in total
- `unindent` #502, 228M in total

## Namespaced debug logging

Create named loggers that are switched on or off by an environment variable or pattern and format messages to a stream; structured log pipelines, console wrappers and telemetry SDKs are out of scope.

- `env_logger` #222, 574M in total
- `env_filter` #532, 208M in total (low confidence: env-var-driven log filtering only)

## WebSocket messaging

Implement the WebSocket protocol as a client, a server or a bring-your-own-I/O state machine and exchange framed messages; Socket.IO-style layers on top, server-sent events and raw HTTP are out of scope.

- `tungstenite` #371, 328M in total
- `tokio-tungstenite` #402, 294M in total

## Template rendering

Compile a text template with embedded expressions, loops and partials (ERB, Haml, Slim, Liquid, Mustache and the like) and render it to a string with given data; Markdown conversion, HTML builders driven purely by code and framework view layers are out of scope.

- `tinytemplate` #445, 261M in total
- `handlebars` #879, 96M in total

## HTTP message parsing

Parse raw HTTP/1.x request and response bytes into method, target, headers and body chunks; full clients and servers, URL parsing and parsers for a single header are out of scope.

- `httparse` #136, 762M in total
- `ureq-proto` #891, 93M in total (low confidence: HTTP protocol support crate)

## Semantic version comparison

Parse semantic version strings, order them and test them against range constraints; language-specific version schemes with no range syntax and dependency resolvers are out of scope.

- `semver` #60, 1.0B in total
- `semver-parser` #556, 192M in total (low confidence: parses semver spec only)

## Shell word splitting

Split a command-line string into argument words following POSIX shell quoting and escaping rules, or quote words back into such a string; argv option parsing and spawning the command are out of scope.

- `shlex` #94, 887M in total
- `shell-words` #659, 153M in total

## File system watching

Subscribe to create, write, rename and remove notifications for files and directories through the operating system's notification facility; following the appended lines of one log file and polling build watchers tied to one tool are out of scope.

- `inotify` #606, 170M in total
- `notify` #627, 163M in total

## Human-readable size formatting

Format byte counts and other quantities as short human-readable strings with unit suffixes such as 1.5 MiB, and parse such strings back to numbers; date and duration phrasing, locale-aware number formatting and arbitrary-precision arithmetic are out of scope.

- `number_prefix` #679, 146M in total
- `bytesize` #811, 109M in total

## Histograms and quantile sketches

Record a stream of numeric samples into a compact fixed-memory histogram or sketch, such as HDR Histogram, t-digest or a biased quantile stream, and query percentiles from it; exact descriptive statistics over full arrays and metrics registries that export to a monitoring system are out of scope.

- `hdrhistogram` #786, 117M in total
- `sketches-ddsketch` #931, 86M in total

## Metrics instrumentation

In-process registries of counters, gauges, timers and histograms that application code updates and that render a snapshot for a monitoring system; standalone histogram data structures, distributed tracing and vendor agents that only ship data to one service are out of scope.

- `prometheus` #668, 151M in total
- `metrics` #803, 111M in total (low confidence: facade only; recorder-based)

## Generated API and schema types

Packages that consist of message, resource and specification types, mostly generated from Protocol Buffers, OpenAPI or other interface definitions, with no behavior beyond field access and serialization glue; the serialization runtimes and the clients that use the types are out of scope.

- `prost-types` #275, 482M in total
- `opentelemetry-proto` #616, 165M in total (low confidence: protobuf generated OTLP types)

## Placeholder and test packages

Hello-world demos, registry and tooling publish tests, tutorial examples and stubs that only announce a move to another package, none of which has real functionality to measure.

- `icu_locid` #581, 178M in total (low confidence: Deprecated stub crate)
- `icu_locid_transform` #595, 174M in total (low confidence: Deprecated stub crate)

## Wrapping, slicing and stripping styled terminal text

Transform strings that may contain ANSI escape codes by stripping the codes, word-wrapping to a column width, or slicing and truncating by visible columns; only measuring display width, adding color styles and stripping indentation are out of scope.

- `anstream` #140, 732M in total (low confidence: colored stream adapters that strip ANSI; partial fit)
- `textwrap` #295, 439M in total

## Percent encoding

Percent-encode arbitrary strings for use in a URL component and decode them back; splitting query strings into pairs, full URL parsing and Punycode are out of scope.

- `percent-encoding` #80, 949M in total
- `urlencoding` #434, 268M in total

## IP address and CIDR parsing

Parse IPv4 and IPv6 address and CIDR network strings into values, and test whether an address falls inside a network; DNS lookups, socket handling and geolocation databases are out of scope.

- `ipnet` #204, 605M in total
- `ipnetwork` #858, 100M in total

## CSV parsing

Parse delimited text with quoting and escaping into records and write records back as CSV; spreadsheet file formats, dataframes and fixed-width formats are out of scope.

- `csv` #446, 258M in total
- `csv-core` #447, 257M in total

## Unicode normalization

Convert text to the Unicode normalization forms NFC, NFD, NFKC and NFKD; case folding, transliteration to ASCII and stringprep profiles are out of scope.

- `icu_normalizer` #207, 601M in total
- `unicode-normalization` #209, 600M in total

## Unicode text segmentation

Find grapheme cluster, word, sentence or line-break boundaries in text according to the Unicode segmentation rules; display width measurement, word wrapping and language-specific tokenizers are out of scope.

- `unicode-segmentation` #214, 586M in total
- `unicode-linebreak` #802, 111M in total

## Key derivation

Derive key material from a secret with HKDF or PBKDF2; memory-hard password hashing such as bcrypt and Argon2, bare message digests and key exchange are out of scope.

- `hkdf` #417, 281M in total
- `pbkdf2` #462, 250M in total

## Queues and linked lists

In-memory FIFO queues, deques, ring buffers and linked lists with push and pop at the ends; channels that pass values between threads, priority queues and persistent job queues are out of scope.

- `crossbeam-deque` #161, 669M in total (low confidence: work-stealing deque, loosely a deque)
- `dlv-list` #840, 103M in total

## DNS messages and resolution

Encode and decode DNS wire-format messages and resource records, and use them to query name servers; host name parsing, public suffix lookup and mDNS service discovery are out of scope.

- `hickory-proto` #922, 87M in total
- `hickory-resolver` #942, 84M in total

## Symbol demangling

Turn mangled C++ or Rust linker symbol names back into readable declarations; reading object files or debug information and capturing stack traces are out of scope.

- `rustc-demangle` #216, 583M in total
- `cpp_demangle` #833, 104M in total

## Expression evaluation

Parse a single arithmetic or boolean expression given as text and evaluate it against a set of variables; full scripting-language interpreters, template engines and regular expressions are out of scope.

- `cexpr` #401, 296M in total
- `cfg-expr` #882, 95M in total

## Glob matching

Test whether path strings match a glob pattern, purely in memory; walking the filesystem, gitignore rule sets and brace-only expansion are out of scope.

- `globset` #458, 252M in total

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `jsonschema` #874, 97M in total

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `uuid` #102, 847M in total

## CSS stylesheet parsing

Parse a whole CSS stylesheet into an AST or object model; selector-only or value-only parsers, tokenizers and plugin-driven transformers are out of scope.

- `cssparser` #884, 95M in total (low confidence: CSS tokenizer and parser primitives)

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `serde_json` #24, 1.4B in total (low confidence: serde-based JSON encoder/decoder; parse benchmark applies)

## Value inspection and formatting

Render arbitrary JavaScript values as human-readable strings for logs, assertions and snapshots; JSON serialization and diffing are out of scope.

- `pretty_assertions` #519, 216M in total (low confidence: colored assertion diffs)

## Child process execution

Spawn a child process and collect its exit status and output; shell-string quoting, PATH lookup and signal tables are out of scope.

- `async-process` #757, 124M in total

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `jsonwebtoken` #538, 203M in total

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `tar` #467, 246M in total

## Terminal string width

Compute how many terminal columns a string or code point occupies, accounting for wide East Asian characters; wrapping, truncating and stripping styled text are out of scope.

- `unicode-width` #107, 833M in total

## Markdown rendering

Parse CommonMark-style Markdown text and render it to HTML or a syntax tree; converting HTML or office documents to Markdown, reStructuredText and terminal rendering are out of scope.

- `pulldown-cmark` #619, 165M in total

## CSS selector matching

Compile CSS selectors and find the matching elements in an already parsed HTML or XML tree; parsing whole stylesheets and parsing the document itself are out of scope.

- `selectors` #954, 82M in total

## JSON path queries

Evaluate a path or query expression such as JSONPath, JMESPath or JSON Pointer against in-memory JSON-like data and return the selected values; JSON parsing, JSON Patch and schema validation are out of scope.

- `jsonpath-rust` #888, 94M in total

## Dataframes

In-memory columnar tables with filter, join, group-by and aggregate operations; compatibility layers over other dataframe libraries, file-format readers alone and remote warehouse clients are out of scope.

- `arrow` #940, 85M in total (low confidence: uncertain from description)

## Chart rendering

Turn numeric series into a static chart image or vector file; interactive widget front ends, graph-layout tools such as Graphviz and terminal sparklines are out of scope.

- `plotters` #480, 240M in total

## Image processing

Decode raster images, apply pixel operations such as resize and crop, and encode the result; single-format codecs, header-only size readers and OCR are out of scope.

- `image` #534, 205M in total

## Text table rendering

Lay out rows of values as an aligned plain-text or ASCII table; full terminal UI toolkits, progress bars and spreadsheet files are out of scope.

- `comfy-table` #832, 104M in total

## File locking

Acquire and release cross-process advisory locks backed by a lock file; in-process mutexes and distributed locks held in a remote service are out of scope.

- `fs2` #924, 87M in total

## File type detection

Identify the format or media type of a file or buffer from its content and magic numbers; extension-to-MIME lookup tables and image dimension readers are out of scope.

- `infer` #740, 128M in total

## MySQL clients

Speak the MySQL wire protocol to run queries and decode result rows; ORMs, query builders and drivers for other databases are out of scope.

- `sqlx-mysql` #893, 92M in total

## HTTP application servers

Listen on a socket, parse HTTP requests and hand them to an application callback through the language's standard server interface (Rack, WSGI/ASGI and the like); routers, middleware, reverse proxies and process supervisors are out of scope.

- `actix-http` #946, 84M in total (low confidence: uncertain from description)

## Redis clients

Speak the Redis protocol to send commands and decode replies; key namespacing wrappers, cache or session stores built on a client, in-memory fakes and job queues are out of scope.

- `redis` #808, 110M in total

## INI and properties parsing

Parse INI-style or Java .properties text of sections and name=value pairs into an in-memory structure; TOML, YAML and other JSON-superset formats, dotenv loading into the process environment and layered configuration managers are out of scope.

- `rust-ini` #759, 122M in total

## Dotenv loading

Parse a .env file of KEY=value lines, with quoting and variable expansion, and load the pairs into the process environment or a map; decoding environment variables into typed structs and general INI or configuration managers are out of scope.

- `dotenvy` #626, 164M in total

## Recursive file copying

Copy a file or a whole directory tree to a new location, preserving structure and modes; atomic single-file replacement, archive extraction and virtual file system abstractions are out of scope.

- `pest_derive` #396, 299M in total (low confidence: fs_extra covers copy among many fs helpers)

## ZIP archiving

Create ZIP archives from in-memory entries and read entries back out of them; tar archives, bare deflate or gzip codecs and other container formats are out of scope.

- `zip` #408, 287M in total

## Edit distance and string similarity

Score how similar two strings are with Levenshtein, Jaro-Winkler or a related metric, or pick the closest match from a list; producing the actual diff hunks and phonetic or full-text search are out of scope.

- `strsim` #44, 1.1B in total

## MIME type lookup

Map a file name or extension to its media type and a media type back to its extensions, using a built-in table; sniffing content from bytes and parsing media type header values are out of scope.

- `mime_guess` #420, 279M in total

## HTTP cookie parsing

Parse Cookie and Set-Cookie header values into names, values and attributes and serialize them back; signing or encrypting cookie values and server session stores are out of scope.

- `cookie` #470, 245M in total

## Media type parsing

Parse a media type string such as a Content-Type header value into type, subtype and parameters and format it back; extension lookup tables, content sniffing and content negotiation are out of scope.

- `mime` #173, 637M in total (low confidence: strongly typed media types; could also be mime-type-lookup)

## IDNA and Punycode conversion

Convert internationalized domain names between Unicode and their ASCII Punycode form according to IDNA or UTS #46; public suffix lookup, full URL parsing and DNS resolution are out of scope.

- `idna` #66, 1.0B in total

## Temporary files and directories

Create uniquely named temporary files and directories and remove them when they are no longer needed; atomic replacement of existing files and in-memory file systems are out of scope.

- `tempfile` #100, 852M in total

## Layered configuration loading

Merge settings from defaults, configuration files and environment variables into one object and read typed values from it by key; parsers for a single file format, dotenv loading alone and discovery of tool rc files are out of scope.

- `config` #773, 118M in total

## Terminal progress bars and spinners

Render a progress bar or spinner line for a running task and redraw it as the task advances; interactive prompts, full terminal UI toolkits and plain log output are out of scope.

- `indicatif` #501, 229M in total

## SQL parsing

Parse SQL statements into tokens or a syntax tree; executing queries, database drivers, query builders and object-relational mappers are out of scope.

- `sqlparser` #965, 81M in total

## JSON Patch

Apply RFC 6902 JSON Patch or RFC 7386 merge patch operations to a JSON document, or compute the patch that turns one document into another; path queries that only read values and text diffs are out of scope.

- `json-patch` #825, 106M in total

## Graph algorithms

In-memory graph structures of nodes and edges with traversal, topological sort, shortest path and connected component algorithms; graph drawing and layout, graph databases and dependency version solvers are out of scope.

- `petgraph` #245, 536M in total

## Resource pools

Hold a bounded set of reusable resources such as connections or buffers and check them out to and back in from concurrent callers; driver-specific connection pools, worker task pools and caches are out of scope.

- `deadpool` #695, 141M in total

## Rate limiting

Decide whether an action for a given key is allowed now under a token bucket, leaky bucket or fixed-window limit; retry and backoff policies, concurrency limiters and gateway products are out of scope.

- `governor` #960, 81M in total

## gRPC

Implement gRPC clients and servers that exchange Protocol Buffers messages over HTTP/2; the Protocol Buffers encoding alone, gateway proxies and other RPC protocols are out of scope.

- `tonic` #314, 413M in total
