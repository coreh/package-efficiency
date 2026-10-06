# Package categories: JSR

1000 of 1000 packages categorized into 110 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Other (no peers yet) (`other`) | 170 | no |  |
| Build, lint and test tooling (`build-tooling`) | 96 | no |  |
| Service SDKs and telemetry (`service-sdks`) | 94 | no |  |
| UI components and hooks (`ui-components`) | 81 | no |  |
| Framework and tool extensions (`framework-extensions`) | 65 | no |  |
| Frameworks and broad libraries (`frameworks`) | 56 | no |  |
| Placeholder and test packages (`placeholder-packages`) | 27 | no |  |
| Applications and daemons (`applications`) | 22 | no |  |
| Schema validation (`schema-validation`) | 19 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| Runtime helpers and shims (`runtime-shims`) | 17 | no |  |
| Library internals (`library-internals`) | 15 | no |  |
| Generated API and schema types (`generated-api-types`) | 15 | no |  |
| Structured logging (`structured-logging`) | 14 | yes | Log 1,000,000 records with five key-value fields each as JSON lines to a null sink. |
| Type definitions (`type-definitions`) | 12 | no |  |
| Child process execution (`process-execution`) | 9 | yes | Spawn the same trivial command 200 times and collect its stdout and exit code. |
| Async concurrency control (`async-concurrency`) | 9 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| Binary serialization (`binary-serialization`) | 9 | yes | Encode and decode 100,000 records with nested integers, strings and arrays. |
| Iterator combinators (`iterator-combinators`) | 9 | yes | Push a million-element iterable through a fixed chain of map, filter, chunk and take steps and reduce the result to a single value. |
| CLI argument parsing (`cli-argument-parsing`) | 8 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| Unique ID generation (`id-generation`) | 8 | yes | Generate one million random unique IDs using the package's default secure generator. |
| Date and time (`date-time`) | 8 | yes | Parse 100,000 ISO 8601 timestamps, add calendar durations and format each back to a string. |
| Language-level abstractions (`language-ergonomics`) | 8 | no |  |
| Tooling internals (AST and code utilities) (`tooling-internals`) | 7 | no |  |
| HTML and XML parsing (`markup-parsing`) | 7 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| HTTP server routing (`http-server-routing`) | 7 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| Digital signatures (`digital-signatures`) | 7 | yes | Generate a key pair, then sign and verify 10,000 short messages. |
| Config format parsing (`config-format-parsing`) | 6 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| Static data and patterns (`static-data`) | 6 | no |  |
| Event emitters (`event-emitter`) | 6 | yes | Register 10 listeners on each of several event names and emit one million events with two arguments. |
| Base64 encoding (`base64-encoding`) | 6 | yes | Encode and decode a 16 MB buffer and 100,000 32-byte values with the standard alphabet. |
| System and foreign bindings (`system-bindings`) | 6 | no |  |
| Environment detection (`environment-detection`) | 6 | no |  |
| Password hashing (`password-hashing`) | 6 | yes | Hash and verify 100 passwords at fixed, equivalent cost parameters. |
| PostgreSQL clients (`postgres-client`) | 6 | yes | Against a local PostgreSQL server, insert 100,000 rows with a prepared statement and read them back. |
| JWT signing and verification (`jwt-signing`) | 5 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Template rendering (`template-rendering`) | 5 | yes | Compile a template that loops over 1,000 records with a conditional and escaped interpolation, then render it 1,000 times. |
| Embedded key-value stores (`embedded-key-value-stores`) | 5 | yes | Write 1,000,000 key-value pairs in batches to a fresh on-disk store, read each back at random, then scan a key range in order. |
| Stream implementations (`stream-implementations`) | 4 | yes | Pipe a fixed number of fixed-size buffer chunks through a chain of passthrough streams to a counting sink. |
| HTTP clients (`http-client`) | 4 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| Cryptographic hashing (`cryptographic-hashing`) | 4 | yes | Digest a 64 MB buffer and 100,000 64-byte messages with the package's primary algorithm. |
| Authenticated encryption (`authenticated-encryption`) | 4 | yes | Seal and open a 16 MB buffer and 100,000 1 KB messages with one key. |
| Identifier case conversion (`case-conversion`) | 4 | yes | Convert 1,000,000 mixed identifiers to snake, camel and kebab case. |
| Markdown rendering (`markdown-parsing`) | 4 | yes | Render a fixed corpus of Markdown documents totalling several megabytes to HTML. |
| Dependency injection containers (`dependency-injection`) | 4 | yes | Register a fixed graph of a few hundred interdependent services with singleton and transient lifetimes, then resolve the root services repeatedly. |
| Reactive signals (`reactive-signals`) | 4 | yes | Build a fixed dependency graph of source values, derived values and effects, then apply a series of source updates and let each propagate. |
| SMTP clients (`smtp-client`) | 4 | yes | Send 10,000 messages of 10 KB each to a local SMTP sink over one connection. |
| JSON parsing (`json-parsing`) | 3 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| Random number generation (`random-number-generation`) | 3 | yes | Seed a generator, draw 10,000,000 64-bit integers and fill a 64 MB buffer. |
| Text diffing (`text-diff`) | 3 | yes | Diff pairs of 10,000-line text files that differ by 1%, 10% and 50% of their lines. |
| Image processing (`image-processing`) | 3 | yes | Decode a fixed set of JPEG and PNG photos, resize each to a thumbnail and re-encode it. |
| HTTP application servers (`http-application-servers`) | 3 | yes | Serve a fixed 1 KB response from a trivial application callback to 100,000 keep-alive requests from a local load generator. |
| Redis clients (`redis-client`) | 3 | yes | Against a local Redis server, run 100,000 SET and GET commands, both one at a time and in pipelines of 100. |
| Message translation (`message-translation`) | 3 | yes | Load a catalog of 5,000 messages in two locales and perform 100,000 lookups with interpolation and pluralization. |
| Semantic version comparison (`semver-comparison`) | 3 | yes | Parse a fixed list of 10,000 version strings, sort them, and test each against a fixed set of range constraints. |
| ZIP archiving (`zip-archiving`) | 3 | yes | Pack a fixed set of in-memory files into a deflate-compressed ZIP archive, then list and extract every entry from it. |
| QR code generation (`qr-code-generation`) | 3 | yes | Encode a fixed set of URLs and text payloads at a given error-correction level and produce the module matrix or SVG for each. |
| Cron expression scheduling (`cron-scheduling`) | 3 | yes | Parse a fixed set of cron expressions and compute the next 1,000 occurrence times of each from a fixed start date. |
| Terminal progress bars and spinners (`terminal-progress-bars`) | 3 | yes | Advance a progress bar 1,000,000 times toward a fixed total while it renders to an in-memory, non-interactive stream. |
| Terminal string styling (`terminal-styling`) | 2 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Tar archiving (`tar-archiving`) | 2 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Indentation stripping (`indentation-stripping`) | 2 | yes | Strip the common leading indentation from 10,000 multi-line text blocks of varying depth. |
| Regular expression matching (`regex-matching`) | 2 | yes | Compile a fixed set of 20 patterns and find all matches of each in a 10 MB text corpus. |
| Non-deflate compression (`block-compression`) | 2 | yes | Compress and decompress a fixed 32 MB mixed text and binary corpus at the default level. |
| PDF reading (`pdf-text-extraction`) | 2 | yes | Extract the text of every page from a fixed set of PDF documents totalling 1,000 pages. |
| Text table rendering (`text-table-rendering`) | 2 | yes | Render a table of 10,000 rows and 8 mixed-type columns to a string. |
| Background job queues (`background-job-queues`) | 2 | yes | Against a local backend, enqueue 10,000 no-op jobs with small arguments and run a worker until the queue is drained. |
| Dotenv loading (`dotenv-loading`) | 2 | yes | Parse the same .env text of 1,000 assignments with quotes, comments and variable references into a key-value map. |
| MongoDB clients (`mongodb-client`) | 2 | yes | Against a local server, insert 10,000 documents into a collection and read them back with a query that returns ten fields each. |
| Path string manipulation (`path-manipulation`) | 2 | yes | Normalize 100,000 path strings with mixed separators and dot segments, and compute the relative path between 100,000 pairs. |
| CSV parsing (`csv-parsing`) | 2 | yes | Parse a 100 MB CSV file of 1,000,000 rows and 10 columns, a quarter of the fields quoted, and write the rows back out. |
| Linear algebra and arrays (`linear-algebra`) | 2 | yes | Multiply two 1,000 by 1,000 matrices of 64-bit floats and multiply 10,000,000 pairs of 4 by 4 matrices. |
| SQLite clients (`sqlite-client`) | 2 | yes | In an in-memory database, insert 1,000,000 rows of 5 columns in one transaction and select them all back. |
| Glob matching (`glob-matching`) | 1 | yes | Compile a fixed set of glob patterns and match each against a fixed list of 10,000 path strings. |
| HTML entity escaping (`html-escaping`) | 1 | yes | Escape the five HTML special characters in 100,000 short strings of mixed text and markup. |
| Value inspection and formatting (`value-inspection`) | 1 | yes | Format a fixed set of nested objects, arrays, Maps, Sets and primitives into strings. |
| Object merging (`object-merging`) | 1 | yes | Merge a fixed sequence of nested plain option objects into one result object, 100,000 times. |
| Stream merging (`stream-merging`) | 1 | yes | Merge 100 readable streams of fixed buffer chunks into one stream and consume it to the end. |
| URL and URI parsing (`url-parsing`) | 1 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 1 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| Color parsing and conversion (`css-color-parsing`) | 1 | yes | Parse a fixed list of 100,000 hex, rgb() and hsl() color strings and convert each to an RGB triple. |
| Namespaced debug logging (`debug-logging`) | 1 | yes | Create 100 namespaced loggers, enable half of them, and log 100,000 formatted messages to a null sink. |
| Hash maps (`hash-maps`) | 1 | yes | Insert 1,000,000 integer and string keys, look each up, iterate, then remove half. |
| LRU caches (`lru-cache`) | 1 | yes | Replay a fixed Zipf-distributed trace of 1,000,000 get/set operations against a cache capped at 10,000 entries. |
| Message channels (`message-channels`) | 1 | yes | Send 1,000,000 small messages from four producers to one consumer through a bounded channel. |
| Checksums (`checksums`) | 1 | yes | Checksum a 64 MB buffer in one call and again in 4 KB incremental updates. |
| TOML parsing (`toml-parsing`) | 1 | yes | Parse a fixed corpus of TOML documents, including a 5,000-line lockfile. |
| ASN.1 DER decoding (`asn1-der-decoding`) | 1 | yes | Decode a fixed set of 1,000 DER-encoded X.509 certificates into their fields. |
| Immutable collections (`immutable-collections`) | 1 | yes | Build a 100,000-entry immutable map by successive inserts, then run a fixed mix of lookups and updates on it. |
| Dataframes (`dataframes`) | 1 | yes | Load a 1,000,000-row table, filter it, group by a key column and compute sum and mean aggregates. |
| Subword tokenization (`subword-tokenization`) | 1 | yes | Encode and decode a 10 MB text corpus with a fixed pretrained vocabulary. |
| WebSocket messaging (`websocket-messaging`) | 1 | yes | Echo 100,000 text and binary messages over a loopback connection, or through the codec in memory. |
| INI and properties parsing (`ini-parsing`) | 1 | yes | Parse the same 5,000-line INI document of sections and key=value pairs, then read every value back by section and key. |
| Sorted maps and prefix trees (`sorted-maps`) | 1 | yes | Insert 1,000,000 string keys, look each up, then run a fixed set of range and prefix scans in key order. |
| Metrics instrumentation (`metrics-instrumentation`) | 1 | yes | Register 100 labelled counters, gauges and histograms, apply 10,000,000 updates from several threads, then render one text snapshot of the registry. |
| MIME type lookup (`mime-type-lookup`) | 1 | yes | Look up the media type for 100,000 file names drawn from 500 distinct extensions, then the default extension for 10,000 media types. |
| URI template expansion (`uri-template-expansion`) | 1 | yes | Expand 1,000 templates covering all four RFC 6570 levels against 100 variable sets each. |
| Temporary files and directories (`temporary-files`) | 1 | yes | Create 10,000 temporary files and 1,000 temporary directories, write 1 KiB to each file and clean everything up. |
| Spreadsheet file reading (`spreadsheet-reading`) | 1 | yes | Open a 20 MB workbook of 5 sheets with 100,000 rows of 10 columns each and read every cell value. |
| Number parsing (`number-parsing`) | 1 | yes | Parse 10,000,000 integer strings and 10,000,000 float strings of 1 to 20 significant digits. |
| Unicode text segmentation (`unicode-segmentation`) | 1 | yes | Iterate over all grapheme cluster and word boundaries of a 50 MB multilingual corpus. |
| Character set transcoding (`charset-transcoding`) | 1 | yes | Decode 10 MB of text in each of Shift_JIS, GBK and windows-1252 to Unicode and encode it back. |
| Noun pluralization (`noun-inflection`) | 1 | yes | Pluralize and then singularize a fixed list of 100,000 English nouns, 5 percent of them irregular. |
| Unauthenticated symmetric ciphers (`symmetric-ciphers`) | 1 | yes | Encrypt and decrypt a 100 MB buffer and 1,000,000 buffers of 64 bytes with a fixed key and nonce. |
| One-time passwords (`one-time-passwords`) | 1 | yes | Generate 1,000,000 TOTP codes for fixed secrets and timestamps and verify each with a window of one step. |
| Single-format image codecs (`image-decoding`) | 1 | yes | Decode 100 images of 4,000 by 3,000 pixels in the member's format to RGBA pixel buffers. |
| Queues and linked lists (`queues-and-linked-lists`) | 1 | yes | Push 10,000,000 items to the back and pop them from the front, keeping the queue at a steady length of 1,000. |
| DNS messages and resolution (`dns-message-codec`) | 1 | yes | Decode and re-encode 1,000,000 DNS response messages that carry 10 mixed A, AAAA, CNAME, MX and TXT records each. |
| Fake data generation (`fake-data-generation`) | 1 | yes | With a fixed seed, generate 1,000,000 records of name, email, street address and date. |
| Embedded script interpreters (`embedded-script-interpreters`) | 1 | yes | Run a script that computes fib(30) recursively and one that sorts a 1,000,000-element array, each 10 times. |
| Class name composition (`classname-composition`) | 1 | yes | Compose 1,000,000 class strings from 10 arguments each, mixing strings, nested arrays and condition objects. |

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `@std/fs` #10, 1M in the last 90 days (low confidence: broad fs helpers (walk, copy, ensureDir); no single task)
- `@std/bytes` #11, 1M in the last 90 days (low confidence: Uint8Array byte helpers; no peers)
- `@std/io` #17, 1M in the last 90 days (low confidence: Reader/Writer I/O utilities; no peers)
- `@std/text` #26, 0M in the last 90 days (low confidence: misc text utilities (slugify, closest string, etc.))
- `@oak/commons` #32, 0M in the last 90 days (low confidence: HTTP helper collection (status, negotiation); no peers)
- `@std/net` #34, 0M in the last 90 days (low confidence: network utilities such as free port lookup)
- `@std/regexp` #54, 0M in the last 90 days
- `@negrel/webpush` #56, 0M in the last 90 days (low confidence: Web Push protocol library; no peers)
- `@david/which` #60, 0M in the last 90 days
- `@bernd/ts-units` #61, 0M in the last 90 days (low confidence: typed physical units; no peers)
- `@cliffy/prompt` #71, 0M in the last 90 days
- `@cliffy/keycode` #72, 0M in the last 90 days
- `@std/front-matter` #83, 0M in the last 90 days (low confidence: front matter extraction; no peers)
- `@bureaudouble/bureau` #84, 0M in the last 90 days (low confidence: unknown package, no description)
- `@david/code-block-writer` #90, 0M in the last 90 days
- `@simple-cdp/simple-cdp` #95, 0M in the last 90 days
- `@bureaudouble/outils` #104, 0M in the last 90 days (low confidence: unclear collection of web tools)
- `@ein/bash-parser` #110, 0M in the last 90 days
- `@gameplay/games` #123, 0M in the last 90 days (low confidence: game definitions for a specific site)
- `@bounded-systems/verbspec` #132, 0M in the last 90 days (low confidence: spec-driven CLI core projecting to multiple surfaces)
- `@astral/astral` #133, 0M in the last 90 days
- `@hckhanh/vn-number` #134, 0M in the last 90 days
- `@geacko/resp3-parser` #141, 0M in the last 90 days (low confidence: RESP parser only; redis-client requires sending commands)
- `@globaltech/mediaforge` #150, 0M in the last 90 days
- `@hongminhee/localtunnel` #151, 0M in the last 90 days
- `@cross/fs` #157, 0M in the last 90 days (low confidence: cross-runtime fs operations; broad)
- `@quarzo-life/moneta` #161, 0M in the last 90 days (low confidence: money arithmetic and formatting; no peers)
- `@std/webgpu` #162, 0M in the last 90 days (low confidence: WebGPU utilities; no peers)
- `@simplewebauthn/server` #167, 0M in the last 90 days
- `@bureaudouble/checkout` #185, 0M in the last 90 days (low confidence: unknown package, no description)
- `@stsoftware/tags` #189, 0M in the last 90 days (low confidence: unclear what tagging means)
- `@bandeira-tech/b3nd-core` #196, 0M in the last 90 days (low confidence: unknown package, no description)
- `@core/match` #198, 0M in the last 90 days
- `@space-operator/deno-command-rpc` #203, 0M in the last 90 days (low confidence: unknown package, no description)
- `@space-operator/flow-lib` #220, 0M in the last 90 days (low confidence: unknown package, no description)
- `@bounded-systems/verbspec-mcp` #229, 0M in the last 90 days (low confidence: unknown package, no description)
- `@arendjr/text-clipper` #237, 0M in the last 90 days
- `@quickwire/core` #246, 0M in the last 90 days (low confidence: unknown package, no description)
- `@stsoftware/neat-ai` #247, 0M in the last 90 days
- `@cliffy/keypress` #252, 0M in the last 90 days
- `@workingdevshero/deno-imap` #260, 0M in the last 90 days
- `@mys/m-rpc` #270, 0M in the last 90 days
- `@clappcodes/transporter` #279, 0M in the last 90 days (low confidence: unknown package, no description)
- `@deco/durable` #280, 0M in the last 90 days (low confidence: unknown package, no description)
- `@deco/inspect-vscode` #282, 0M in the last 90 days (low confidence: unknown package, no description)
- `@tarasglek/markdown-download` #291, 0M in the last 90 days (low confidence: unknown package, no description)
- `@sillvva/utils` #308, 0M in the last 90 days (low confidence: general utility grab bag)
- `@sigmasd/ipc-spy` #310, 0M in the last 90 days
- `@reda/remember-promise` #313, 0M in the last 90 days
- `@wok/utils` #320, 0M in the last 90 days (low confidence: unknown package, no description)
- `@deno/framework-detect` #329, 0M in the last 90 days (low confidence: unknown package, no description)
- `@imcotton/offmark` #331, 0M in the last 90 days
- `@quentinadam/uint8array-extension` #348, 0M in the last 90 days
- `@fartlabs/jsonx` #354, 0M in the last 90 days
- `@mys/worker-fn` #358, 0M in the last 90 days
- `@dx3mod/rpm-parser` #363, 0M in the last 90 days
- `@gabriel/ts-pattern` #364, 0M in the last 90 days
- `@avalero/maths` #368, 0M in the last 90 days (low confidence: vague maths library)
- `@sostad/sync-engine` #369, 0M in the last 90 days
- `@schematicos/rtk-query` #371, 0M in the last 90 days (low confidence: unknown package, no description)
- `@act/act` #377, 0M in the last 90 days (low confidence: unclear purpose)
- `@kriss-u/py-ast` #383, 0M in the last 90 days
- `@sigma/striprtf` #384, 0M in the last 90 days
- `@global-markets/lib` #387, 0M in the last 90 days (low confidence: unknown package, no description)
- `@ooneex/helper` #399, 0M in the last 90 days (low confidence: misc helper functions)
- `@tvartom/pagesequence` #401, 0M in the last 90 days
- `@utility/string` #403, 0M in the last 90 days (low confidence: misc string utilities)
- `@fathym/dfs` #406, 0M in the last 90 days (low confidence: distributed file system abstraction)
- `@summer/pyrolysis` #409, 0M in the last 90 days (low confidence: Python-like utilities; vague)
- `@cross/service` #412, 0M in the last 90 days
- `@seriousme/opifex` #421, 0M in the last 90 days
- `@axhxrx/internationalization-format-converter` #423, 0M in the last 90 days (low confidence: unknown i18n format converter)
- `@uri/typed-api` #432, 0M in the last 90 days (low confidence: unknown package, no description)
- `@samjmck/tobcalc-lib` #435, 0M in the last 90 days
- `@gamedev/objecs` #438, 0M in the last 90 days
- `@malven/modu` #440, 0M in the last 90 days (low confidence: unknown package, no description)
- `@kgwinnup/unicode` #441, 0M in the last 90 days (low confidence: unknown package, no description)
- `@reggi/bliss` #446, 0M in the last 90 days (low confidence: unclear code-to-interface generation)
- `@olets/css-fluid-length` #447, 0M in the last 90 days
- `@fathym/eac-deno-kv` #452, 0M in the last 90 days (low confidence: EaC schema for Deno KV; specific)
- `@developer3/safe-keys` #453, 0M in the last 90 days (low confidence: browser key pair storage; unclear)
- `@chances/render-loop` #454, 0M in the last 90 days
- `@lala/classy` #455, 0M in the last 90 days
- `@spy4x/platform` #459, 0M in the last 90 days (low confidence: unknown package, no description)
- `@wildboar/nsap-address` #466, 0M in the last 90 days
- `@http/response` #467, 0M in the last 90 days
- `@hugoalh/http-header-link` #468, 0M in the last 90 days
- `@paoramen/cheer-reader` #472, 0M in the last 90 days
- `@poolifier/tatami-ng` #481, 0M in the last 90 days (low confidence: benchmarking library)
- `@iwanglang/observation-visual-acuity` #483, 0M in the last 90 days (low confidence: unknown, no description)
- `@mblonyox/keu-tools` #486, 0M in the last 90 days (low confidence: unknown)
- `@octo/thoth` #487, 0M in the last 90 days
- `@pedrokehl/caminho` #489, 0M in the last 90 days
- `@indexsupply/shovel-config` #491, 0M in the last 90 days (low confidence: unknown config)
- `@lambdalisue/reservator` #494, 0M in the last 90 days
- `@staxman/containerlib` #509, 0M in the last 90 days (low confidence: home server deploy API)
- `@taisan11/kejibanhelper` #510, 0M in the last 90 days (low confidence: bbs dat file helper)
- `@emish89/smile2emoji` #511, 0M in the last 90 days
- `@creativenull/deckjs` #513, 0M in the last 90 days
- `@fifo/convee` #514, 0M in the last 90 days
- `@lambdalisue/indexer` #518, 0M in the last 90 days
- `@lala/appraisal` #520, 0M in the last 90 days
- `@fathym/synaptic` #539, 0M in the last 90 days (low confidence: unknown)
- `@sevenc-nanashi/utaformatix-ts` #557, 0M in the last 90 days
- `@aralroca/diff-dom-streaming` #578, 0M in the last 90 days
- `@creativenull/pokerjs` #587, 0M in the last 90 days
- `@fusionstrings/swisseph-wasi` #588, 0M in the last 90 days
- `@bradford-tech/supabase-integrity-attest` #589, 0M in the last 90 days (low confidence: Apple App Attest verification)
- `@umbrella/db` #591, 0M in the last 90 days (low confidence: unknown db)
- `@fontoxml/docxml` #599, 0M in the last 90 days (low confidence: docx library, unknown)
- `@suzuki-shunsuke/commit-ts` #607, 0M in the last 90 days (low confidence: unknown)
- `@nospoon/nospoon-integrations` #614, 0M in the last 90 days (low confidence: unknown)
- `@uri/ai-utils` #640, 0M in the last 90 days (low confidence: unknown)
- `@deno/kv-utils` #641, 0M in the last 90 days (low confidence: Deno KV utilities)
- `@hugoalh/github-sodium` #642, 0M in the last 90 days (low confidence: GitHub secret sealed-box encryption)
- `@hansschall/rpc-broker` #665, 0M in the last 90 days
- `@mark/german-cases` #675, 0M in the last 90 days
- `@sftsrv/synk` #696, 0M in the last 90 days
- `@raise/han-convert` #705, 0M in the last 90 days
- `@uri/silly-nlp` #716, 0M in the last 90 days (low confidence: unknown)
- `@alphaxiv/fugu` #729, 0M in the last 90 days (low confidence: unknown)
- `@vwkd/inflation` #730, 0M in the last 90 days
- `@global-markets/db` #732, 0M in the last 90 days (low confidence: unknown db)
- `@stackforge-eu/factur-x` #744, 0M in the last 90 days (low confidence: Factur-X, unknown)
- `@casys/mcp-server` #748, 0M in the last 90 days (low confidence: MCP server, unknown)
- `@spy4x/server` #764, 0M in the last 90 days (low confidence: unknown server)
- `@planetarium/lib9c` #765, 0M in the last 90 days (low confidence: unknown)
- `@goatdb/orderstamp` #778, 0M in the last 90 days
- `@rdsq/open` #783, 0M in the last 90 days
- `@setu-ts/common` #788, 0M in the last 90 days (low confidence: shared contracts, unknown)
- `@bureaudouble/scripted` #794, 0M in the last 90 days (low confidence: unknown)
- `@milly/async-signal` #798, 0M in the last 90 days
- `@nrfcloud/problem-detail` #804, 0M in the last 90 days
- `@udibo/http-error` #812, 0M in the last 90 days
- `@bradenmacdonald/quantity-math-js` #814, 0M in the last 90 days
- `@http/request` #818, 0M in the last 90 days
- `@locr-company/js-progress` #822, 0M in the last 90 days (low confidence: generic progress class)
- `@hugoalh/shuffle-array` #833, 0M in the last 90 days
- `@k8o/colorandom` #842, 0M in the last 90 days
- `@oomph/core` #865, 0M in the last 90 days (low confidence: unknown)
- `@vcltk/tokenizer` #877, 0M in the last 90 days
- `@bolt/bolt` #883, 0M in the last 90 days (low confidence: unknown)
- `@orama/crawly` #885, 0M in the last 90 days (low confidence: unknown crawler)
- `@vcltk/parser` #888, 0M in the last 90 days
- `@ooneex/exception` #895, 0M in the last 90 days
- `@fuman/deno` #896, 0M in the last 90 days (low confidence: unknown)
- `@fuman/net` #898, 0M in the last 90 days (low confidence: unknown)
- `@forgo/create` #903, 0M in the last 90 days (low confidence: unknown)
- `@mys1024/me` #908, 0M in the last 90 days (low confidence: unknown)
- `@vwkd/income-tax-de` #917, 0M in the last 90 days
- `@vcltk/token` #928, 0M in the last 90 days (low confidence: unknown token)
- `@reactive/utils` #930, 0M in the last 90 days (low confidence: unknown utils)
- `@http/discovery` #931, 0M in the last 90 days
- `@uri/rmmbr` #934, 0M in the last 90 days (low confidence: unknown)
- `@dajiaji/mlkem` #937, 0M in the last 90 days
- `@deno/panic` #938, 0M in the last 90 days (low confidence: unknown)
- `@hazelnut/core` #952, 0M in the last 90 days (low confidence: unknown)
- `@perish/shield` #958, 0M in the last 90 days (low confidence: unknown)
- `@mightyone/customer-agent` #960, 0M in the last 90 days (low confidence: unknown)
- `@qlever-llc/trellis` #968, 0M in the last 90 days (low confidence: unknown)
- `@mightyone/firebird-agent` #969, 0M in the last 90 days (low confidence: unknown)
- `@quentinadam/array-extension` #970, 0M in the last 90 days
- `@frontside/continuation` #972, 0M in the last 90 days
- `@bandeira-tech/b3nd-move` #974, 0M in the last 90 days (low confidence: unknown)
- `@bobbyg603/deno-imap` #976, 0M in the last 90 days
- `@holie/tools` #977, 0M in the last 90 days (low confidence: unknown tools)
- `@zanix/notifications` #979, 0M in the last 90 days
- `@jotsr/delayed` #982, 0M in the last 90 days (low confidence: Promise-based sleep/delay/interval/timeout helper; no taxonomy benchmark matches (async-concurrency is about task pools).)
- `@jvitormelo/extenso-br` #990, 0M in the last 90 days
- `@sylc/dkill` #996, 0M in the last 90 days (low confidence: Kills processes by listening port; process-execution is about spawning, not port lookup/killing.)

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `@std/assert` #5, 3M in the last 90 days
- `@std/testing` #20, 0M in the last 90 days
- `@std/expect` #30, 0M in the last 90 days
- `@deno/loader` #42, 0M in the last 90 days (low confidence: Deno resolver/loader)
- `@luca/esbuild-deno-loader` #52, 0M in the last 90 days
- `@deno/graph` #64, 0M in the last 90 days
- `@deno/esbuild-plugin` #85, 0M in the last 90 days
- `@deno/dnt` #92, 0M in the last 90 days
- `@circleci/v8-coverage-collector` #94, 0M in the last 90 days (low confidence: coverage collector for a vendor's test plugin)
- `@circleci/vitest-circleci-coverage` #103, 0M in the last 90 days
- `@c4spar/mock-fetch` #111, 0M in the last 90 days
- `@deno/doc` #115, 0M in the last 90 days
- `@c4spar/mock-command` #126, 0M in the last 90 days
- `@timetree/biome-config` #128, 0M in the last 90 days
- `@cross/test` #129, 0M in the last 90 days
- `@schematicos/codegen` #131, 0M in the last 90 days (low confidence: code generator, no description)
- `@libs/testing` #137, 0M in the last 90 days
- `@zuke/core` #170, 0M in the last 90 days
- `@deno/emit` #175, 0M in the last 90 days
- `@circleci/jest-circleci-coverage` #221, 0M in the last 90 days
- `@deco/dev` #223, 0M in the last 90 days
- `@astrale/typescript-config` #249, 0M in the last 90 days
- `@swamp-club/swamp-testing` #251, 0M in the last 90 days (low confidence: unknown, testing helpers)
- `@david/gagen` #266, 0M in the last 90 days (low confidence: generates GitHub Actions YAML)
- `@dprint/formatter` #281, 0M in the last 90 days
- `@dx/tano` #286, 0M in the last 90 days
- `@astrale/commitlint-config` #293, 0M in the last 90 days
- `@deno/wasmbuild` #298, 0M in the last 90 days
- `@adllang/local-setup` #301, 0M in the last 90 days (low confidence: unclear what it does beyond installing dev tools)
- `@schematicos/generator-server` #305, 0M in the last 90 days (low confidence: code generator, no description)
- `@antfu/eslint-flat-config-utils` #314, 0M in the last 90 days
- `@kt3k/license-checker` #318, 0M in the last 90 days
- `@in/test` #323, 0M in the last 90 days
- `@check/deps` #327, 0M in the last 90 days
- `@jurassicjs/monodeno` #357, 0M in the last 90 days
- `@unplugin/macros` #361, 0M in the last 90 days
- `@codemonument/update-denoconfig` #365, 0M in the last 90 days (low confidence: updates deno.json config files via CLI)
- `@freshvintage/buildkite` #411, 0M in the last 90 days
- `@fairfox/deno-esbuild` #413, 0M in the last 90 days
- `@runreal/buildkite-ts` #414, 0M in the last 90 days (low confidence: empty description; name suggests CI pipeline helper)
- `@denops/test` #418, 0M in the last 90 days
- `@axhxrx/dprint-config` #422, 0M in the last 90 days
- `@zuke/gh` #427, 0M in the last 90 days (low confidence: gh CLI task wrapper for builds)
- `@jlarky/fork-tsup-preset-solid` #433, 0M in the last 90 days
- `@cliffy/testing` #442, 0M in the last 90 days
- `@mizchi/zdnt` #445, 0M in the last 90 days (low confidence: empty description; likely dnt-related)
- `@logtape/testing` #461, 0M in the last 90 days (low confidence: testing utilities for a logging lib)
- `@nfnitloop/deno-embedder` #462, 0M in the last 90 days
- `@onyx/esbuild-plugin-rewrite-relative-import-extensions` #519, 0M in the last 90 days
- `@fluentci/bun` #553, 0M in the last 90 days
- `@mys/bump` #571, 0M in the last 90 days
- `@open-fn/tooling` #580, 0M in the last 90 days (low confidence: CLI tooling for open-fn runtime)
- `@ximagine/eslint-plugin` #602, 0M in the last 90 days
- `@csm-actions/securefix-action` #638, 0M in the last 90 days (low confidence: GitHub action, no description)
- `@hongminhee/deno-task-hooks` #646, 0M in the last 90 days
- `@lambdalisue/import-map-importer` #659, 0M in the last 90 days (low confidence: import map processor)
- `@barelyhuman/knex-types` #712, 0M in the last 90 days (low confidence: type generator)
- `@minify-html/deno` #728, 0M in the last 90 days
- `@deco/codemod-toolkit` #760, 0M in the last 90 days
- `@david/dts-minify` #769, 0M in the last 90 days
- `@zuke/deno` #776, 0M in the last 90 days
- `@bureaudouble-forks/esbuild-deno-loader` #785, 0M in the last 90 days
- `@fmt/biome-fmt` #805, 0M in the last 90 days
- `@http/generate` #807, 0M in the last 90 days
- `@alinea/suite` #816, 0M in the last 90 days
- `@fluentci/codecov` #823, 0M in the last 90 days (low confidence: CI pipeline)
- `@fluentci/rust` #824, 0M in the last 90 days (low confidence: CI pipeline)
- `@fluentci/microcks` #826, 0M in the last 90 days (low confidence: CI pipeline)
- `@luxass/eslint-utils` #828, 0M in the last 90 days
- `@pumpn/eslint-config` #845, 0M in the last 90 days
- `@tsirysndr/fluent-az-pipelines` #855, 0M in the last 90 days (low confidence: pipeline generator)
- `@koddsson/eslint-config-tscompat` #856, 0M in the last 90 days
- `@sigmasd/doc-gen` #859, 0M in the last 90 days
- `@eryue0220/unplugin-stylex` #890, 0M in the last 90 days
- `@danteasc4/ban-enum` #923, 0M in the last 90 days
- `@zuke/docker` #939, 0M in the last 90 days
- `@molt/core` #940, 0M in the last 90 days
- `@zuke/dprint` #945, 0M in the last 90 days
- `@hugoalh/deno-lint-rules` #948, 0M in the last 90 days
- `@zuke/tsc-alias` #955, 0M in the last 90 days
- `@david/publish-on-tag` #962, 0M in the last 90 days
- `@zuke/docker-compose` #966, 0M in the last 90 days
- `@zuke/gcloud` #967, 0M in the last 90 days
- `@zuke/node` #975, 0M in the last 90 days
- `@zuke/playwright` #980, 0M in the last 90 days
- `@zuke/vitest` #981, 0M in the last 90 days
- `@zuke/cspell` #984, 0M in the last 90 days
- `@zuke/nest` #985, 0M in the last 90 days
- `@zuke/tsc` #986, 0M in the last 90 days
- `@zuke/dpdm` #987, 0M in the last 90 days
- `@zuke/vite` #989, 0M in the last 90 days
- `@zuke/orval` #992, 0M in the last 90 days
- `@zuke/oxlint` #993, 0M in the last 90 days
- `@zuke/tsdown` #994, 0M in the last 90 days
- `@zuke/husky` #999, 0M in the last 90 days
- `@zuke/storybook` #1000, 0M in the last 90 days

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `@supabase/functions-js` #1, 10M in the last 90 days
- `@supabase/supabase-js` #2, 8M in the last 90 days
- `@usehercules/sdk` #40, 0M in the last 90 days
- `@bradenmacdonald/s3-lite-client` #41, 0M in the last 90 days
- `@cmd-johnson/oauth2-client` #63, 0M in the last 90 days (low confidence: no description; OAuth2 client)
- `@supabase/server` #76, 0M in the last 90 days
- `@openai/openai` #80, 0M in the last 90 days
- `@creit-tech/stellar-router-sdk` #91, 0M in the last 90 days
- `@virti/microapp-sdk` #102, 0M in the last 90 days (low confidence: vendor-specific, unclear)
- `@nostrify/nostrify` #127, 0M in the last 90 days
- `@trakt/api` #130, 0M in the last 90 days
- `@nats-io/jetstream` #135, 0M in the last 90 days
- `@slack/protocols` #136, 0M in the last 90 days
- `@nats-io/nats-core` #138, 0M in the last 90 days
- `@panva/oauth4webapi` #140, 0M in the last 90 days
- `@nats-io/transport-deno` #145, 0M in the last 90 days
- `@mtkruto/mtkruto` #146, 0M in the last 90 days
- `@globaltech/gspeak` #154, 0M in the last 90 days
- `@logtape/otel` #159, 0M in the last 90 days
- `@kellnerd/musicbrainz` #177, 0M in the last 90 days
- `@evex/linejs` #180, 0M in the last 90 days
- `@creit-tech/stellar-wallets-kit` #188, 0M in the last 90 days (low confidence: wallet kit, description empty)
- `@nats-io/kv` #193, 0M in the last 90 days (low confidence: NATS KV, no description)
- `@deno/sandbox` #204, 0M in the last 90 days
- `@ignitemarketing/ai-fallback` #209, 0M in the last 90 days (low confidence: unknown, no description)
- `@panva/openid-client` #217, 0M in the last 90 days (low confidence: OAuth/OIDC client; no matching category)
- `@fedify/webfinger` #231, 0M in the last 90 days (low confidence: WebFinger client)
- `@suzuki-shunsuke/github-app-token` #241, 0M in the last 90 days (low confidence: vendor-specific, unclear)
- `@lmscript/client` #243, 0M in the last 90 days
- `@fluentci/sdk` #255, 0M in the last 90 days
- `@csm-actions/label` #268, 0M in the last 90 days (low confidence: GitHub label management)
- `@langchain/pyodide-sandbox` #275, 0M in the last 90 days (low confidence: pyodide sandbox wrapper)
- `@valtown/sdk` #288, 0M in the last 90 days
- `@seratch/slack-web-api-client` #292, 0M in the last 90 days
- `@meshtastic/core` #294, 0M in the last 90 days
- `@deno/deploy` #299, 0M in the last 90 days (low confidence: truncated/unknown)
- `@lucasavila00/sgjs` #303, 0M in the last 90 days
- `@nostr/tools` #319, 0M in the last 90 days
- `@cerberus/figma` #335, 0M in the last 90 days
- `@soapbox/nspec` #336, 0M in the last 90 days
- `@nats-io/obj` #347, 0M in the last 90 days
- `@lumnn/magento2-api` #355, 0M in the last 90 days
- `@nanofire/database` #397, 0M in the last 90 days
- `@isham/typed-home-assistant` #407, 0M in the last 90 days
- `@nats-io/services` #416, 0M in the last 90 days
- `@scrapfly/scrapfly-sdk` #431, 0M in the last 90 days
- `@hckhanh/google-safe-browsing` #436, 0M in the last 90 days
- `@ipinfo/client` #444, 0M in the last 90 days
- `@pup/api-client` #451, 0M in the last 90 days (low confidence: API client, vague)
- `@gadicc/yahoo-finance2` #475, 0M in the last 90 days
- `@union/client` #478, 0M in the last 90 days
- `@zuke/otel` #490, 0M in the last 90 days
- `@pinta365/oura-api` #501, 0M in the last 90 days
- `@cloudydeno/kubernetes-client` #515, 0M in the last 90 days
- `@launchdarkly/cloudflare-server-sdk` #551, 0M in the last 90 days
- `@pup/telemetry` #568, 0M in the last 90 days (low confidence: no description; telemetry)
- `@epi/ollama` #575, 0M in the last 90 days
- `@alphaxiv/agents` #593, 0M in the last 90 days (low confidence: agents SDK for a vendor)
- `@simplewebauthn/browser` #594, 0M in the last 90 days (low confidence: WebAuthn browser client)
- `@codehz/mtproto` #605, 0M in the last 90 days
- `@tijs/oauth-client-deno` #610, 0M in the last 90 days
- `@slack/api` #615, 0M in the last 90 days
- `@deno/kv-oauth` #619, 0M in the last 90 days (low confidence: OAuth helper on Deno KV)
- `@cosense/std` #620, 0M in the last 90 days (low confidence: Cosense UserScript std)
- `@grud/devtools` #621, 0M in the last 90 days (low confidence: helper for grud)
- `@friendsofshopware/app-server` #623, 0M in the last 90 days
- `@wevm/viem` #625, 0M in the last 90 days
- `@meshtastic/transport-web-serial` #627, 0M in the last 90 days
- `@fenv-org/app-store-connect` #645, 0M in the last 90 days
- `@wok/k8s` #649, 0M in the last 90 days (low confidence: no description)
- `@prompt-pal/node-sdk` #650, 0M in the last 90 days
- `@cloudydeno/docker-registry-client` #652, 0M in the last 90 days
- `@bbc/sqs-consumer` #662, 0M in the last 90 days
- `@jer/colornames` #678, 0M in the last 90 days (low confidence: colornames API client)
- `@wok/openapi-client` #684, 0M in the last 90 days (low confidence: no description)
- `@tma/sdk` #693, 0M in the last 90 days
- `@quad/openfeature-provider-postgres` #789, 0M in the last 90 days
- `@meshtastic/transport-http` #806, 0M in the last 90 days
- `@omochice/redmine` #810, 0M in the last 90 days (low confidence: no description)
- `@malinowskip/push` #835, 0M in the last 90 days
- `@hookdeck/sdk` #839, 0M in the last 90 days
- `@molikodev/twitchts` #843, 0M in the last 90 days (low confidence: no description)
- `@discord-applications/app` #846, 0M in the last 90 days (low confidence: no description)
- `@fakoua/winrm` #852, 0M in the last 90 days (low confidence: winrm client)
- `@commercelayer/js-auth` #862, 0M in the last 90 days
- `@soundify/web-api` #866, 0M in the last 90 days
- `@xlsoftware/smartshell-sdk` #873, 0M in the last 90 days
- `@danimydev/wolfy` #891, 0M in the last 90 days
- `@epi/image-to-url` #893, 0M in the last 90 days
- `@fathym/msal` #904, 0M in the last 90 days (low confidence: unclear)
- `@commercelayer/organization-config` #922, 0M in the last 90 days
- `@mtcute/core` #926, 0M in the last 90 days
- `@colibri/core` #927, 0M in the last 90 days
- `@huy9k/supabase-edge-function-helpers` #954, 0M in the last 90 days (low confidence: unclear)

## UI components and hooks

Browser UI component libraries, icon sets, positioning engines and React hooks, whose work is rendering and interaction rather than one standard computational task.

- `@bureaudouble/islet` #118, 0M in the last 90 days (low confidence: unknown, likely UI)
- `@fathym/atomic` #207, 0M in the last 90 days (low confidence: unknown, likely UI)
- `@bureaudouble/responsive-image` #285, 0M in the last 90 days (low confidence: unknown, likely UI)
- `@fathym/atomic-design-kit` #289, 0M in the last 90 days
- `@in/style` #324, 0M in the last 90 days (low confidence: style engine)
- `@cerberus/panda-preset` #328, 0M in the last 90 days (low confidence: Panda CSS preset)
- `@cerberus/preset-cerberus-theme` #337, 0M in the last 90 days
- `@sirius/design-system` #338, 0M in the last 90 days (low confidence: empty description, name suggests design system)
- `@thesgj/nextjs-toploader` #339, 0M in the last 90 days
- `@cerberus/tokens` #341, 0M in the last 90 days (low confidence: design tokens)
- `@global-markets/ui` #353, 0M in the last 90 days (low confidence: empty description, name suggests UI)
- `@gm/hooks` #388, 0M in the last 90 days
- `@radix-ui-fork/react-primitive` #420, 0M in the last 90 days
- `@cross/log` #424, 0M in the last 90 days
- `@radix-ui-fork/react-slot` #425, 0M in the last 90 days
- `@fathym/atomic-icons` #471, 0M in the last 90 days (low confidence: empty description; atomic icons)
- `@nostrify/react` #508, 0M in the last 90 days (low confidence: no description; Nostr React hooks presumably)
- `@clo/react-mutation` #516, 0M in the last 90 days
- `@radix-ui-fork/react-use-controllable-state` #541, 0M in the last 90 days
- `@radix-ui-fork/react-use-callback-ref` #552, 0M in the last 90 days
- `@rezi/svelte-gestures` #583, 0M in the last 90 days
- `@clo/react-markdown` #585, 0M in the last 90 days
- `@bureaudouble/icons` #611, 0M in the last 90 days
- `@radix-ui-fork/primitive` #624, 0M in the last 90 days
- `@radix-ui-fork/react-id` #636, 0M in the last 90 days
- `@radix-ui-fork/react-context` #639, 0M in the last 90 days
- `@radix-ui-fork/number` #643, 0M in the last 90 days
- `@radix-ui-fork/react-collection` #661, 0M in the last 90 days
- `@radix-ui-fork/react-use-layout-effect` #666, 0M in the last 90 days
- `@radix-ui-fork/react-visually-hidden` #673, 0M in the last 90 days
- `@radix-ui-fork/react-toolbar` #679, 0M in the last 90 days
- `@radix-ui-fork/react-announce` #686, 0M in the last 90 days
- `@radix-ui-fork/react-popover` #687, 0M in the last 90 days
- `@radix-ui-fork/react-accordion` #689, 0M in the last 90 days
- `@radix-ui-fork/react-scroll-area` #690, 0M in the last 90 days
- `@radix-ui-fork/react-hover-card` #691, 0M in the last 90 days
- `@radix-ui-fork/react-form` #692, 0M in the last 90 days
- `@usevue/core` #694, 0M in the last 90 days (low confidence: vue wrappers)
- `@radix-ui-fork/react-select` #695, 0M in the last 90 days
- `@radix-ui-fork/react-radio-group` #697, 0M in the last 90 days
- `@radix-ui-fork/react-collapsible` #699, 0M in the last 90 days
- `@codehz/mutable-element` #701, 0M in the last 90 days (low confidence: unclear html element helper)
- `@radix-ui-fork/react-use-previous` #703, 0M in the last 90 days
- `@radix-ui-fork/react-aspect-ratio` #706, 0M in the last 90 days
- `@radix-ui-fork/react-slider` #707, 0M in the last 90 days
- `@radix-ui-fork/react-progress` #708, 0M in the last 90 days
- `@radix-ui-fork/react-accessible-icon` #709, 0M in the last 90 days
- `@radix-ui-fork/react-avatar` #715, 0M in the last 90 days
- `@radix-ui-fork/react-checkbox` #720, 0M in the last 90 days
- `@radix-ui-fork/react-direction` #725, 0M in the last 90 days
- `@radix-ui-fork/react-dropdown-menu` #727, 0M in the last 90 days
- `@radix-ui-fork/react-presence` #734, 0M in the last 90 days
- `@radix-ui-fork/react-navigation-menu` #736, 0M in the last 90 days
- `@ahmed/card` #737, 0M in the last 90 days (low confidence: unrecognized, no description)
- `@fathym/code-editor` #738, 0M in the last 90 days
- `@radix-ui-fork/react-portal` #740, 0M in the last 90 days
- `@radix-ui-fork/react-dismissable-layer` #742, 0M in the last 90 days
- `@cerberus/preset-elysium-theme` #749, 0M in the last 90 days
- `@radix-ui-fork/react-tabs` #753, 0M in the last 90 days
- `@radix-ui-fork/react-switch` #758, 0M in the last 90 days
- `@radix-ui-fork/react-alert-dialog` #761, 0M in the last 90 days
- `@radix-ui-fork/react-popper` #762, 0M in the last 90 days
- `@radix-ui-fork/react-use-size` #768, 0M in the last 90 days
- `@radix-ui-fork/react-roving-focus` #774, 0M in the last 90 days
- `@radix-ui-fork/react-focus-scope` #777, 0M in the last 90 days
- `@radix-ui-fork/react-focus-guards` #779, 0M in the last 90 days
- `@radix-ui-fork/react-use-escape-keydown` #782, 0M in the last 90 days
- `@radix-ui-fork/rect` #786, 0M in the last 90 days
- `@radix-ui-fork/react-arrow` #790, 0M in the last 90 days
- `@radix-ui-fork/react-label` #808, 0M in the last 90 days
- `@preact-hooks/fetch` #851, 0M in the last 90 days
- `@lithen/fns` #857, 0M in the last 90 days (low confidence: html/css helper fns)
- `@jesubohr/hotkeypad` #863, 0M in the last 90 days
- `@bureaudouble/cmdk` #867, 0M in the last 90 days
- `@tony/icons` #881, 0M in the last 90 days
- `@radix-ui-fork/react-menu` #887, 0M in the last 90 days
- `@radix-ui-fork/react-separator` #909, 0M in the last 90 days
- `@radix-ui-fork/react-toggle` #914, 0M in the last 90 days
- `@adam/confetti` #920, 0M in the last 90 days
- `@radix-ui-fork/react-toggle-group` #925, 0M in the last 90 days
- `@preact-icons/common` #932, 0M in the last 90 days

## Framework and tool extensions

Plugins, engines, adapters, middleware and asset bundles that only work inside one host framework or tool, such as Rails engines, Rack middleware, OmniAuth strategies, Faraday adapters and Fluentd or Logstash plugins; the host frameworks themselves and build or test tooling plugins are out of scope.

- `@logtape/pretty` #74, 0M in the last 90 days
- `@fresh/plugin-vite` #97, 0M in the last 90 days
- `@hono/zod-validator` #119, 0M in the last 90 days
- `@optique/config` #164, 0M in the last 90 days (low confidence: config file support for Optique)
- `@jcs224/hono-sessions` #174, 0M in the last 90 days
- `@nats-io/nuid` #176, 0M in the last 90 days
- `@hono/mcp` #178, 0M in the last 90 days
- `@vicary/fresh-graphql` #215, 0M in the last 90 days
- `@jadsn/vite-plugin-sri` #218, 0M in the last 90 days
- `@denops/std` #250, 0M in the last 90 days
- `@denops/core` #253, 0M in the last 90 days
- `@olets/tailwindcss-fluid-font-size` #257, 0M in the last 90 days
- `@wok/helmet-mods` #265, 0M in the last 90 days (low confidence: unknown, no description)
- `@deno-libs/gql` #269, 0M in the last 90 days
- `@danet/swagger` #272, 0M in the last 90 days
- `@pup/plugin` #317, 0M in the last 90 days (low confidence: plugin for pup process manager, empty description)
- `@danet/handlebars` #322, 0M in the last 90 days
- `@fedify/redis` #332, 0M in the last 90 days
- `@hono/zod-openapi` #340, 0M in the last 90 days
- `@hono/otel` #345, 0M in the last 90 days
- `@zanix/utils` #346, 0M in the last 90 days (low confidence: lint rules and utils for Zanix framework)
- `@hono/standard-validator` #356, 0M in the last 90 days
- `@tajpouria/cors` #373, 0M in the last 90 days
- `@fresh/plugin-tailwind` #374, 0M in the last 90 days
- `@wok/helmet` #402, 0M in the last 90 days (low confidence: helmet-style middleware for a host framework, unrecognized)
- `@hono/swagger-ui` #473, 0M in the last 90 days
- `@bureaudouble/context-session` #482, 0M in the last 90 days (low confidence: empty description; session middleware)
- `@optique/logtape` #500, 0M in the last 90 days (low confidence: integration for Optique CLI parser)
- `@dklab/oak-routing-ctrl` #505, 0M in the last 90 days
- `@netscript/plugin-workers` #523, 0M in the last 90 days
- `@rehype-pretty/transformers` #526, 0M in the last 90 days
- `@optique/man` #533, 0M in the last 90 days
- `@optique/zod` #534, 0M in the last 90 days
- `@optique/env` #535, 0M in the last 90 days
- `@optique/temporal` #536, 0M in the last 90 days
- `@optique/clack` #538, 0M in the last 90 days
- `@optique/prompt` #542, 0M in the last 90 days
- `@netscript/plugin-streams` #546, 0M in the last 90 days
- `@polyseam/cliffy-provider-gh-releases` #554, 0M in the last 90 days
- `@hongminhee/markdown-it-jsr-ref` #556, 0M in the last 90 days
- `@logtape/hono` #565, 0M in the last 90 days
- `@o-industrial/oi-core-pack` #598, 0M in the last 90 days (low confidence: core pack for flow UI)
- `@optique/standard-schema` #634, 0M in the last 90 days (low confidence: Optique plugin)
- `@http/interceptor` #647, 0M in the last 90 days (low confidence: HTTP handler wrappers)
- `@zanix/datamaster` #654, 0M in the last 90 days (low confidence: Zanix ecosystem connectors)
- `@logtape/drizzle-orm` #655, 0M in the last 90 days
- `@front-work/state-core` #674, 0M in the last 90 days (low confidence: framework state core)
- `@shougo/ddu-vim` #704, 0M in the last 90 days
- `@zanix/auth` #719, 0M in the last 90 days (low confidence: auth module of Zanix framework)
- `@nicholai/moleculer-casl` #735, 0M in the last 90 days
- `@soapbox/kysely-deno-sqlite` #751, 0M in the last 90 days
- `@deco/mcp` #763, 0M in the last 90 days
- `@denops/vim-channel-command` #767, 0M in the last 90 days
- `@danet/zod` #775, 0M in the last 90 days
- `@zanix/asyncmq` #791, 0M in the last 90 days (low confidence: Zanix module over message brokers)
- `@netscript/plugin-auth` #815, 0M in the last 90 days
- `@anywidget/deno` #817, 0M in the last 90 days (low confidence: jupyter widget kernel)
- `@roz/grammy-autoquote` #820, 0M in the last 90 days
- `@netscript/plugin-sagas` #836, 0M in the last 90 days
- `@marvinh-test/fresh-tailwind` #837, 0M in the last 90 days (low confidence: fresh tailwind plugin)
- `@netscript/plugin-triggers` #874, 0M in the last 90 days
- `@bergold/password-middleware` #878, 0M in the last 90 days (low confidence: password middleware)
- `@honey32/next-query-utils` #894, 0M in the last 90 days (low confidence: next query utils)
- `@pup/plugin-web-interface` #913, 0M in the last 90 days
- `@shougo/ddc-vim` #921, 0M in the last 90 days (low confidence: unclear)

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `@std/collections` #25, 0M in the last 90 days (low confidence: broad standard-library collection helpers)
- `@fedify/fedify` #68, 0M in the last 90 days
- `@es-toolkit/es-toolkit` #69, 0M in the last 90 days
- `@fresh/core` #79, 0M in the last 90 days
- `@cross/utils` #114, 0M in the last 90 days (low confidence: broad standard-library collection helpers)
- `@deco/deco` #142, 0M in the last 90 days
- `@ayonli/jsext` #149, 0M in the last 90 days (low confidence: broad extension library)
- `@fathym/common` #166, 0M in the last 90 days (low confidence: Fathym common architecture library)
- `@danet/core` #201, 0M in the last 90 days
- `@olli/zod-api` #205, 0M in the last 90 days (low confidence: typed API client/server config on zod)
- `@open-fn/core` #211, 0M in the last 90 days (low confidence: runtime core for open-fn)
- `@pixel/funweb` #242, 0M in the last 90 days
- `@oxian/oxian-js` #245, 0M in the last 90 days
- `@o-industrial/atomic` #316, 0M in the last 90 days (low confidence: vague library description)
- `@in/teract` #321, 0M in the last 90 days (low confidence: state management/interaction system, broad)
- `@in/runtime` #325, 0M in the last 90 days (low confidence: JSX runtime)
- `@in/vader` #326, 0M in the last 90 days (low confidence: utility collection)
- `@clo/lib` #330, 0M in the last 90 days (low confidence: general purpose libraries)
- `@fathym/eac-applications` #344, 0M in the last 90 days (low confidence: EaC applications schema/runtime)
- `@wen/utils` #449, 0M in the last 90 days
- `@copilotz/copilotz` #460, 0M in the last 90 days
- `@rdtlabs/ts-utils` #493, 0M in the last 90 days (low confidence: Utility grab-bag; contents unclear from description)
- `@totto/lib` #512, 0M in the last 90 days (low confidence: general utility library with Result types)
- `@baetheus/fun` #522, 0M in the last 90 days
- `@oxi/core` #555, 0M in the last 90 days (low confidence: Utility grab-bag; contents unclear from description)
- `@mastrojs/mastro` #559, 0M in the last 90 days
- `@nikiv/utils` #570, 0M in the last 90 days
- `@renda/renda` #577, 0M in the last 90 days (low confidence: rendering engine for the web, vague)
- `@zanix/server` #581, 0M in the last 90 days
- `@usesvelte/core` #586, 0M in the last 90 days (low confidence: svelte app helper wrappers)
- `@bossley9/sjsx` #592, 0M in the last 90 days
- `@tui/strings` #596, 0M in the last 90 days
- `@opentf/std` #601, 0M in the last 90 days (low confidence: general stdlib)
- `@coven/utils` #631, 0M in the last 90 days (low confidence: general utils)
- `@ggoodman/std` #667, 0M in the last 90 days (low confidence: general tools)
- `@gymburgdorf/nodehelpers` #669, 0M in the last 90 days (low confidence: vague helpers)
- `@llamaindex/core` #683, 0M in the last 90 days
- `@fathym/runtime` #688, 0M in the last 90 days (low confidence: reference runtime)
- `@ryoppippi/str-fns` #698, 0M in the last 90 days (low confidence: string utilities)
- `@htmllover/html-router` #733, 0M in the last 90 days (low confidence: client-side SPA router with web components)
- `@hugojosefson/fns` #759, 0M in the last 90 days (low confidence: generic utility functions)
- `@mys/utils` #811, 0M in the last 90 days
- `@sieve/nonstd` #831, 0M in the last 90 days
- `@fuman/utils` #858, 0M in the last 90 days (low confidence: Utility grab-bag; contents unclear from description)
- `@wen/t-utils` #860, 0M in the last 90 days
- `@billy/tsu` #861, 0M in the last 90 days
- `@modules/utils` #864, 0M in the last 90 days
- `@uwu/utils` #872, 0M in the last 90 days
- `@chzky/fp` #879, 0M in the last 90 days (low confidence: Utility grab-bag; contents unclear from description)
- `@setu-ts/runtime` #910, 0M in the last 90 days (low confidence: unclear)
- `@setu-ts/kernel` #919, 0M in the last 90 days (low confidence: unclear)
- `@remeda/remeda` #935, 0M in the last 90 days
- `@fathym/eac-api` #943, 0M in the last 90 days (low confidence: unclear)
- `@deco/actors` #946, 0M in the last 90 days
- `@tundralibs/utils` #947, 0M in the last 90 days (low confidence: unclear)
- `@udibo/juniper` #963, 0M in the last 90 days

## Placeholder and test packages

Hello-world demos, registry and tooling publish tests, tutorial examples and stubs that only announce a move to another package, none of which has real functionality to measure.

- `@ghoullier/fp-nutshell` #81, 0M in the last 90 days (low confidence: tutorial FP utilities)
- `@pnpm-e2e/foo` #96, 0M in the last 90 days
- `@mys1024/worker-fn` #187, 0M in the last 90 days
- `@kwhinnery/animals` #219, 0M in the last 90 days (low confidence: unknown, no description)
- `@rus/greet` #302, 0M in the last 90 days
- `@ry/test` #307, 0M in the last 90 days
- `@kl/demo1` #390, 0M in the last 90 days
- `@marvinh-test/fresh-init` #395, 0M in the last 90 days
- `@marvinh-test/jsr-cli-test-publish` #450, 0M in the last 90 days
- `@jgunst/string-utils` #492, 0M in the last 90 days
- `@mys/starter-deno` #497, 0M in the last 90 days
- `@marvinh-test/fresh-island` #529, 0M in the last 90 days (low confidence: no description, test-like name)
- `@patrickjs/test-package` #576, 0M in the last 90 days
- `@darwish/utils` #595, 0M in the last 90 days
- `@marvinh/add` #653, 0M in the last 90 days
- `@flacial/division` #660, 0M in the last 90 days (low confidence: trivial divide function)
- `@kevin/mitchell` #664, 0M in the last 90 days
- `@kt3k/hello` #670, 0M in the last 90 days
- `@feiye/calc` #680, 0M in the last 90 days
- `@dallmo/array-search` #685, 0M in the last 90 days
- `@wen/test-utils` #713, 0M in the last 90 days (low confidence: generic js utils, no description)
- `@cknight-test/jsr-install-test` #714, 0M in the last 90 days
- `@divy/test` #718, 0M in the last 90 days (low confidence: name suggests test package)
- `@http/examples` #819, 0M in the last 90 days
- `@huw/dist` #825, 0M in the last 90 days (low confidence: no description)
- `@cknight-test/jsr-version-test` #850, 0M in the last 90 days
- `@antfu/test-add` #875, 0M in the last 90 days

## Applications and daemons

Complete servers, daemons, command-line programs and websites that happen to be published as importable packages and are run rather than called for one task; build, lint and test tools and reusable frameworks are out of scope.

- `@deno/installer-shell-setup` #48, 0M in the last 90 days (low confidence: no description; installer setup script)
- `@pup/pup` #169, 0M in the last 90 days
- `@fry69/files-to-prompt-ts` #210, 0M in the last 90 days
- `@bids/validator` #222, 0M in the last 90 days (low confidence: domain-specific dataset validator)
- `@cyclonedx/cdxgen` #238, 0M in the last 90 days
- `@michaelmass/stodo` #258, 0M in the last 90 days
- `@fedify/cli` #376, 0M in the last 90 days
- `@csm-actions/update-branch-action` #379, 0M in the last 90 days (low confidence: GitHub action)
- `@goog/flow-lens` #386, 0M in the last 90 days
- `@fathym/fai` #415, 0M in the last 90 days
- `@fresh/init` #476, 0M in the last 90 days (low confidence: empty description; fresh init scaffold)
- `@garn/commit` #550, 0M in the last 90 days
- `@sigma/minimize` #569, 0M in the last 90 days (low confidence: CLI that finds Deno permissions)
- `@fakoua/powerai` #724, 0M in the last 90 days
- `@jotsr/fcnc` #731, 0M in the last 90 days (low confidence: naming checker for FreeCAD)
- `@deco/warp` #752, 0M in the last 90 days
- `@deno/deployctl` #773, 0M in the last 90 days
- `@suzuki-shunsuke/update-pr-branch` #797, 0M in the last 90 days (low confidence: no description)
- `@gar/echo` #821, 0M in the last 90 days
- `@iamwxq/minigrep` #907, 0M in the last 90 days (low confidence: Unrecognized or unclear from description)
- `@wyattjoh/jmap-mcp` #956, 0M in the last 90 days
- `@pomdtr/libsqlstudio` #995, 0M in the last 90 days (low confidence: unclear)

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `@zod/zod` #37, 0M in the last 90 days
- `@valibot/valibot` #100, 0M in the last 90 days
- `@core/unknownutil` #139, 0M in the last 90 days (low confidence: runtime type predicates for unknown values)
- `@danet/validatte` #239, 0M in the last 90 days (low confidence: decorator class validator)
- `@badrap/valita` #309, 0M in the last 90 days
- `@paseri/paseri` #506, 0M in the last 90 days
- `@t3-oss/env-core` #531, 0M in the last 90 days (low confidence: validated env vars via schemas; env-specific)
- `@spy4x/validation` #608, 0M in the last 90 days (low confidence: no description; name suggests validation)
- `@paseri/compiler` #612, 0M in the last 90 days (low confidence: AOT compiler for validators)
- `@oridune/validator` #633, 0M in the last 90 days
- `@mxdvl/valibot` #702, 0M in the last 90 days
- `@quentinadam/zod` #717, 0M in the last 90 days
- `@ooneex/validation` #726, 0M in the last 90 days (low confidence: validation plus error handling, ecosystem-specific)
- `@wok/typebox` #792, 0M in the last 90 days (low confidence: name only, no description)
- `@nrfcloud/validate-with-typebox` #800, 0M in the last 90 days
- `@jmondi/zod-friendly-forms` #841, 0M in the last 90 days
- `@smonn/validator` #886, 0M in the last 90 days
- `@oxi/schema` #911, 0M in the last 90 days
- `@superstruct/core` #991, 0M in the last 90 days

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `@marvinh/test-shims` #212, 0M in the last 90 days (low confidence: unknown, name suggests shims)
- `@esroyo/network-information-api-polyfill` #227, 0M in the last 90 days
- `@li/regexp-escape-polyfill` #233, 0M in the last 90 days
- `@arcmantle/reflect-metadata` #349, 0M in the last 90 days
- `@quentinadam/ensure` #350, 0M in the last 90 days
- `@hugoalh/is-string-singleline` #382, 0M in the last 90 days
- `@garretmh/nullish` #437, 0M in the last 90 days
- `@ib/rusty-sleep` #443, 0M in the last 90 days (low confidence: sleep helper, empty description)
- `@hugoalh/is-object-plain` #484, 0M in the last 90 days
- `@beast/compat` #558, 0M in the last 90 days
- `@hijst/right-pad` #566, 0M in the last 90 days
- `@coven/predicates` #632, 0M in the last 90 days
- `@hugoalh/is-string-ascii` #677, 0M in the last 90 days
- `@llamaindex/env` #844, 0M in the last 90 days
- `@tundralibs/compat` #849, 0M in the last 90 days
- `@tunnckocore/arr-includes` #889, 0M in the last 90 days (low confidence: array includes predicate)
- `@nick/utf8` #941, 0M in the last 90 days

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `@std/internal` #4, 3M in the last 90 days
- `@cliffy/internal` #43, 0M in the last 90 days
- `@deno/cache-dir` #70, 0M in the last 90 days (low confidence: Deno CLI module cache)
- `@img/internal` #77, 0M in the last 90 days
- `@fresh/build-id` #87, 0M in the last 90 days (low confidence: no description; Fresh build id)
- `@fedify/vocab-runtime` #228, 0M in the last 90 days
- `@o-industrial/common` #267, 0M in the last 90 days (low confidence: unknown common library)
- `@pup/common` #278, 0M in the last 90 days (low confidence: unknown, no description)
- `@windmill-labs/shared-utils` #537, 0M in the last 90 days (low confidence: no description; shared utils of windmill)
- `@valibot/to-json-schema` #656, 0M in the last 90 days (low confidence: schema converter)
- `@hooksmith/core` #766, 0M in the last 90 days (low confidence: core contracts of Hooksmith)
- `@mtcute/file-id` #944, 0M in the last 90 days
- `@mtcute/wasm` #959, 0M in the last 90 days
- `@zarrita/storage` #971, 0M in the last 90 days
- `@adllang/adl-runtime` #997, 0M in the last 90 days (low confidence: Unrecognized or unclear from description)

## Generated API and schema types

Packages that consist of message, resource and specification types, mostly generated from Protocol Buffers, OpenAPI or other interface definitions, with no behavior beyond field access and serialization glue; the serialization runtimes and the clients that use the types are out of scope.

- `@open-schemas/zod` #160, 0M in the last 90 days
- `@fathym/eac-azure` #168, 0M in the last 90 days
- `@meshtastic/protobufs` #182, 0M in the last 90 days
- `@open-schemas/valibot` #190, 0M in the last 90 days
- `@fathym/eac` #197, 0M in the last 90 days (low confidence: EaC core types)
- `@fathym/eac-licensing` #225, 0M in the last 90 days
- `@fedify/vocab` #235, 0M in the last 90 days (low confidence: code-generated vocabulary types)
- `@fathym/eac-sources` #254, 0M in the last 90 days
- `@fathym/eac-identity` #375, 0M in the last 90 days (low confidence: schema package, no description)
- `@cuss/cuss2-typescript-models` #392, 0M in the last 90 days
- `@fathym/eac-iot` #521, 0M in the last 90 days (low confidence: IoT schema types for EaC)
- `@luxass/github-schema` #663, 0M in the last 90 days
- `@cloudydeno/kubernetes-apis` #681, 0M in the last 90 days
- `@fathym/eac-github` #892, 0M in the last 90 days (low confidence: EaC schema)
- `@eai/models` #933, 0M in the last 90 days (low confidence: Unrecognized or unclear from description)

## Structured logging

Application loggers that format records with levels and key-value fields, as JSON or colored text, and write them to a sink; environment-switched debug loggers, telemetry exporters and vendor log shippers are out of scope.

- `@eai/logging-ts` #7, 2M in the last 90 days (low confidence: no description; name suggests logging)
- `@std/log` #31, 0M in the last 90 days
- `@logtape/logtape` #35, 0M in the last 90 days
- `@logtape/file` #101, 0M in the last 90 days (low confidence: LogTape file sink; not a full logger)
- `@logtape/redaction` #143, 0M in the last 90 days (low confidence: redaction for logger records)
- `@mapokapo/simcolog` #284, 0M in the last 90 days (low confidence: simple logger)
- `@denosaurs/log` #290, 0M in the last 90 days (low confidence: stream-based logger)
- `@rubiks/rubiks` #366, 0M in the last 90 days
- `@kitsonk/xhr` #428, 0M in the last 90 days
- `@pixelic/logger` #532, 0M in the last 90 days
- `@danielfroz/slog` #637, 0M in the last 90 days
- `@zuke/console` #722, 0M in the last 90 days (low confidence: leveled logger plus layout primitives for builds)
- `@deno-library/logger` #906, 0M in the last 90 days
- `@frytg/logger` #983, 0M in the last 90 days

## Type definitions

Packages that ship only TypeScript types and have no runtime code.

- `@standard-schema/spec` #120, 0M in the last 90 days
- `@libs/typing` #152, 0M in the last 90 days
- `@open-schemas/types` #184, 0M in the last 90 days
- `@evex/linejs-types` #191, 0M in the last 90 days
- `@pup/api-definitions` #264, 0M in the last 90 days (low confidence: unknown, no description)
- `@evex/loose-types` #315, 0M in the last 90 days (low confidence: likely types only, description vague)
- `@nostrify/types` #488, 0M in the last 90 days
- `@cosense/types` #540, 0M in the last 90 days
- `@fathym/steward` #616, 0M in the last 90 days
- `@coven/types` #626, 0M in the last 90 days
- `@askua/core` #644, 0M in the last 90 days (low confidence: types, vague)
- `@kz/common-types` #900, 0M in the last 90 days

## Child process execution

Spawn a child process and collect its exit status and output; shell-string quoting, PATH lookup and signal tables are out of scope.

- `@david/dax` #59, 0M in the last 90 days
- `@david/shell` #117, 0M in the last 90 days
- `@opensrc/deno-open` #240, 0M in the last 90 days (low confidence: opens files via spawned default apps)
- `@elsoul/child-process` #400, 0M in the last 90 days
- `@libs/run` #419, 0M in the last 90 days
- `@utility/git` #477, 0M in the last 90 days (low confidence: git helpers via subprocess)
- `@hugojosefson/run-simple` #755, 0M in the last 90 days
- `@zuke/git` #809, 0M in the last 90 days
- `@zuke/npm` #847, 0M in the last 90 days

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `@std/async` #14, 1M in the last 90 days
- `@core/asyncutil` #232, 0M in the last 90 days
- `@poolifier/poolifier-web-worker` #295, 0M in the last 90 days (low confidence: web worker pool)
- `@sv2dev/tasque` #334, 0M in the last 90 days
- `@tyler/duckhawk` #389, 0M in the last 90 days (low confidence: bluebird-style promise utilities)
- `@reda/parallelize-generator-promises` #394, 0M in the last 90 days (low confidence: runs generator-yielded promises in parallel)
- `@henrygd/queue` #404, 0M in the last 90 days
- `@poolifier/poolifier` #457, 0M in the last 90 days
- `@117/mutex` #964, 0M in the last 90 days (low confidence: unclear)

## Binary serialization

Encode structured values to a compact binary format and decode them back, such as Protocol Buffers, MessagePack, CBOR and bincode; text formats, columnar data and byte-order helpers are out of scope.

- `@bernd/ts-zeug` #51, 0M in the last 90 days (low confidence: mixed grab bag incl. mqtt5 and msgpack)
- `@std/msgpack` #99, 0M in the last 90 days
- `@std/cbor` #195, 0M in the last 90 days
- `@lucsoft/web-bson` #262, 0M in the last 90 days
- `@lambdalisue/messagepack-rpc` #396, 0M in the last 90 days (low confidence: MessagePack-RPC, mostly RPC layer)
- `@lambdalisue/messagepack` #465, 0M in the last 90 days
- `@kasif-apps/marshal` #562, 0M in the last 90 days
- `@lilith/hypixel-plugin-message` #564, 0M in the last 90 days (low confidence: serializes a game plugin message format)
- `@mtcute/tl-runtime` #957, 0M in the last 90 days

## Iterator combinators

Lazy map, filter, take, chunk, zip and similar combinators over synchronous or asynchronous iterables; eager array and object helpers, general utility belts and stream class implementations are out of scope.

- `@doctor/iterstar` #393, 0M in the last 90 days
- `@radix-ui-fork/react-compose-refs` #430, 0M in the last 90 days (low confidence: functional async utilities, vague)
- `@core/iterutil` #597, 0M in the last 90 days
- `@hongminhee/aitertools` #617, 0M in the last 90 days
- `@coven/iterables` #630, 0M in the last 90 days
- `@lambdalisue/itertools` #635, 0M in the last 90 days
- `@hugoalh/range-iterator` #657, 0M in the last 90 days (low confidence: range iteration)
- `@hugoalh/unique-array` #827, 0M in the last 90 days (low confidence: unique array elements)
- `@aram/jrange` #880, 0M in the last 90 days (low confidence: range function)

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `@std/cli` #13, 1M in the last 90 days
- `@cliffy/flags` #46, 0M in the last 90 days
- `@cliffy/command` #47, 0M in the last 90 days
- `@optique/core` #125, 0M in the last 90 days
- `@optique/run` #147, 0M in the last 90 days
- `@optique/discover` #179, 0M in the last 90 days (low confidence: command discovery for Optique)
- `@lightbery/dynamic-cli` #495, 0M in the last 90 days (low confidence: dynamic CLI builder, vague)
- `@luca/flag` #796, 0M in the last 90 days (low confidence: description unclear)

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `@std/uuid` #27, 0M in the last 90 days
- `@std/ulid` #73, 0M in the last 90 days
- `@hono-rate-limiter/hono-rate-limiter` #173, 0M in the last 90 days
- `@sitnik/nanoid` #277, 0M in the last 90 days
- `@yi/ulid` #574, 0M in the last 90 days
- `@falentio/anaid` #721, 0M in the last 90 days (low confidence: unrecognized, possibly ID generator)
- `@quentinadam/uuidv7` #781, 0M in the last 90 days
- `@cybertoken/cybertoken` #853, 0M in the last 90 days (low confidence: token format)

## Date and time

Parse, format and do calendar arithmetic on dates, times and durations; time zone database packages, HTTP-date-only helpers and clock sources are out of scope.

- `@std/datetime` #50, 0M in the last 90 days
- `@zone-x/zone-x` #206, 0M in the last 90 days (low confidence: timezone utils for tests, WIP)
- `@ry/one-true-date` #360, 0M in the last 90 days (low confidence: empty description, name suggests date handling)
- `@utility/date` #498, 0M in the last 90 days (low confidence: date utility collection)
- `@mary/date-fns` #613, 0M in the last 90 days
- `@xtool/dayjs` #618, 0M in the last 90 days
- `@wilcosp/ms-relative` #668, 0M in the last 90 days (low confidence: ms duration formatting)
- `@spy4x/time` #784, 0M in the last 90 days (low confidence: unrecognized, no description)

## Language-level abstractions

Trait definitions, declarative macros, error types, lazy statics, marker and wrapper types that shape code at compile time and have no standalone runtime task.

- `@inaiat/resultar` #274, 0M in the last 90 days
- `@quentinadam/assert` #297, 0M in the last 90 days
- `@fp-utils/result` #380, 0M in the last 90 days
- `@fp-utils/option` #439, 0M in the last 90 days
- `@core/errorutil` #560, 0M in the last 90 days
- `@sigmasd/rust-types` #606, 0M in the last 90 days
- `@quentinadam/unreachable` #756, 0M in the last 90 days
- `@quad/invariant` #793, 0M in the last 90 days

## Tooling internals (AST and code utilities)

Building blocks used inside compilers and linters, such as AST node helpers, traversal, scope analysis, tokenizing and code frames; standalone parsers are out of scope.

- `@ts-morph/common` #86, 0M in the last 90 days
- `@ts-morph/bootstrap` #93, 0M in the last 90 days
- `@ts-morph/ts-morph` #230, 0M in the last 90 days
- `@deco/deno-ast-wasm` #271, 0M in the last 90 days (low confidence: unknown, no description)
- `@davidbonnet/astring` #333, 0M in the last 90 days
- `@lino/rehype-urls` #840, 0M in the last 90 days (low confidence: rehype plugin)
- `@vcltk/ast` #949, 0M in the last 90 days (low confidence: unclear)

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `@b-fuze/deno-dom` #28, 0M in the last 90 days
- `@libs/xml` #75, 0M in the last 90 days
- `@std/xml` #89, 0M in the last 90 days
- `@maxim-mazurok/sax-ts` #192, 0M in the last 90 days
- `@mikaelporttila/rss` #304, 0M in the last 90 days (low confidence: RSS/Atom XML deserializer; benchmark would be parsing a feed)
- `@sftsrv/structured-html` #629, 0M in the last 90 days (low confidence: HTML to structured data)
- `@bureaudouble/html-parse-stringify` #741, 0M in the last 90 days (low confidence: html-parse-stringify, no description)

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `@std/http` #3, 7M in the last 90 days (low confidence: std/http is a grab bag (file server, cookies, route helper); weak fit)
- `@hono/hono` #22, 0M in the last 90 days
- `@oak/oak` #39, 0M in the last 90 days
- `@oak/acorn` #474, 0M in the last 90 days
- `@http/route` #524, 0M in the last 90 days
- `@trpc/server` #710, 0M in the last 90 days (low confidence: RPC router, may not map to routing benchmark)
- `@quad/route-pattern` #795, 0M in the last 90 days (low confidence: URL pattern matching, not full request dispatch)

## Digital signatures

Generate key pairs, sign messages and verify signatures with ECDSA, Ed25519 or RSA; signature trait definitions, JWT framing and certificate handling are out of scope.

- `@noble/curves` #148, 0M in the last 90 days
- `@noble/ed25519` #163, 0M in the last 90 days
- `@nats-io/nkeys` #186, 0M in the last 90 days
- `@key/gen-ssh-ed25519` #306, 0M in the last 90 days (low confidence: SSH ed25519 key generation only, no sign/verify described)
- `@sebringj/pemmican` #312, 0M in the last 90 days
- `@noble/post-quantum` #448, 0M in the last 90 days
- `@noble/secp256k1` #658, 0M in the last 90 days

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `@std/yaml` #16, 1M in the last 90 days
- `@std/jsonc` #29, 0M in the last 90 days
- `@eemeli/yaml` #98, 0M in the last 90 days
- `@david/jsonc-morph` #144, 0M in the last 90 days
- `@dallmo/yaml` #868, 0M in the last 90 days (low confidence: obsolete yaml module)
- `@dallmo/util-yaml` #905, 0M in the last 90 days

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `@denosaurs/emoji` #122, 0M in the last 90 days
- `@bids/schema` #199, 0M in the last 90 days (low confidence: BIDS schema JSON blob)
- `@donovanglover/base16-tailwind` #463, 0M in the last 90 days
- `@thai/address-utils` #579, 0M in the last 90 days (low confidence: no description; Thai address data presumably)
- `@coven/constants` #628, 0M in the last 90 days (low confidence: constants package)
- `@geacko/mimes` #803, 0M in the last 90 days (low confidence: mime table)

## Event emitters

In-process publish/subscribe objects with on/off/emit semantics; DOM EventTarget implementations, plugin hook systems and reactive streams are out of scope.

- `@garretmh/typed-event-target` #672, 0M in the last 90 days
- `@kf/mediator` #682, 0M in the last 90 days
- `@quentinadam/event-emitter` #750, 0M in the last 90 days
- `@mebus/mebus` #871, 0M in the last 90 days (low confidence: message bus)
- `@mapokapo/simevt` #916, 0M in the last 90 days
- `@denosaurs/event` #942, 0M in the last 90 days

## Base64 encoding

Encode bytes to base64 text and decode them back; hexadecimal, base58 and other alphabets, and PEM framing are out of scope.

- `@std/encoding` #8, 2M in the last 90 days
- `@hexagon/base64` #263, 0M in the last 90 days
- `@scure/base` #283, 0M in the last 90 days
- `@doctor/encoding-stream` #590, 0M in the last 90 days (low confidence: streaming base64/base32/hex encoders)
- `@cross/base64` #780, 0M in the last 90 days
- `@stdext/encoding` #802, 0M in the last 90 days (low confidence: hexdump helpers extending std encoding)

## System and foreign bindings

Bindings to operating system APIs, C libraries and other language runtimes, whose work is done by the code they wrap; prebuilt per-platform import libraries are out of scope.

- `@denosaurs/plug` #49, 0M in the last 90 days
- `@sigma/pty-ffi` #256, 0M in the last 90 days
- `@divy/sdl2` #543, 0M in the last 90 days
- `@sigma/gtk-py` #651, 0M in the last 90 days
- `@sigma/camera` #700, 0M in the last 90 days
- `@divy/libllama` #876, 0M in the last 90 days

## Environment detection

One-shot probes of the host such as CPU count and features, terminal state, user, host name, time zone and standard directories, which return in constant time and have no workload to scale.

- `@cross/runtime` #116, 0M in the last 90 days
- `@cross/env` #158, 0M in the last 90 days (low confidence: env var get/set/validate)
- `@cross/dir` #259, 0M in the last 90 days
- `@david/which-runtime` #378, 0M in the last 90 days
- `@404wolf/xdg-portable` #622, 0M in the last 90 days
- `@tsirysndr/env-js` #799, 0M in the last 90 days

## Password hashing

Hash and verify passwords with a deliberately slow, salted algorithm such as bcrypt, scrypt or Argon2; fast message digests, HMAC and general key derivation are out of scope.

- `@stdext/crypto` #82, 0M in the last 90 days
- `@rabbit-company/argon2id` #273, 0M in the last 90 days
- `@felix/argon2` #434, 0M in the last 90 days
- `@denorg/scrypt` #470, 0M in the last 90 days
- `@felix/bcrypt` #572, 0M in the last 90 days
- `@da/bcrypt` #899, 0M in the last 90 days

## PostgreSQL clients

Speak the PostgreSQL wire protocol to run queries and decode result rows; ORMs, query builders, connection-pool add-ons and drivers for other databases are out of scope.

- `@db/postgres` #55, 0M in the last 90 days
- `@byzanteam/kysely-deno-postgres-dialect` #213, 0M in the last 90 days
- `@y0/postgres` #261, 0M in the last 90 days (low confidence: no description, name suggests postgres)
- `@bartlomieju/postgres` #311, 0M in the last 90 days
- `@kysely/kysely` #408, 0M in the last 90 days (low confidence: query builder; needs a driver to run the benchmark)
- `@oxian/ominipg` #544, 0M in the last 90 days (low confidence: PostgreSQL toolkit, broader than a client)

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `@panva/jose` #9, 1M in the last 90 days
- `@zaubrik/djwt` #121, 0M in the last 90 days
- `@cross/jwt` #165, 0M in the last 90 days
- `@wok/djwt` #343, 0M in the last 90 days
- `@nats-io/jwt` #953, 0M in the last 90 days

## Template rendering

Compile a text template with embedded expressions, loops and partials (ERB, Haml, Slim, Liquid, Mustache and the like) and render it to a string with given data; Markdown conversion, HTML builders driven purely by code and framework view layers are out of scope.

- `@bgub/eta` #362, 0M in the last 90 days
- `@eta-dev/eta` #528, 0M in the last 90 days
- `@tmpl/core` #530, 0M in the last 90 days (low confidence: no description; name suggests template core)
- `@thai/html` #754, 0M in the last 90 days (low confidence: tagged-template HTML string generation)
- `@fartlabs/ht` #772, 0M in the last 90 days (low confidence: HTML rendering library, code-driven)

## Embedded key-value stores

Persistent, ordered key-value databases that run inside the application process and store data in local files, such as B+tree and LSM-tree engines; in-memory caches, SQL engines and clients for a database server are out of scope.

- `@olli/kvdex` #156, 0M in the last 90 days
- `@kitsonk/kv-toolbox` #181, 0M in the last 90 days (low confidence: Deno KV utilities)
- `@goatdb/goatdb` #248, 0M in the last 90 days (low confidence: distributed version-controlled database)
- `@fedify/denokv` #276, 0M in the last 90 days (low confidence: no description; Fedify KV driver)
- `@cross/kv` #351, 0M in the last 90 days

## Stream implementations

Userland readable/writable/passthrough stream classes that data is piped through; helpers that only consume or collect an existing stream are out of scope.

- `@lambdalisue/workerio` #747, 0M in the last 90 days (low confidence: Worker messages to streams)
- `@shaulov/water` #834, 0M in the last 90 days
- `@fuman/io` #897, 0M in the last 90 days (low confidence: io utilities)
- `@core/streamutil` #901, 0M in the last 90 days (low confidence: Unrecognized or unclear from description)

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `@kinetexjs/kinetex` #153, 0M in the last 90 days
- `@chiba/wget` #208, 0M in the last 90 days (low confidence: file download)
- `@uri/gamla` #429, 0M in the last 90 days
- `@exceptionless/fetchclient` #882, 0M in the last 90 days

## Cryptographic hashing

Compute cryptographic message digests such as SHA-1, SHA-2, SHA-3, BLAKE and MD5; HMAC, key derivation, password hashing and non-cryptographic hashes are out of scope.

- `@std/crypto` #15, 1M in the last 90 days (low confidence: Web Crypto extensions, mainly digests)
- `@noble/hashes` #108, 0M in the last 90 days
- `@takker/md5` #573, 0M in the last 90 days
- `@quentinadam/hash` #745, 0M in the last 90 days

## Authenticated encryption

Encrypt and decrypt byte buffers with an AEAD cipher such as AES-GCM or ChaCha20-Poly1305; bare block and stream ciphers, TLS and public-key cryptography are out of scope.

- `@negrel/http-ece` #58, 0M in the last 90 days (low confidence: RFC 8188 aes128gcm content encoding)
- `@brc-dd/iron` #410, 0M in the last 90 days
- `@noble/ciphers` #757, 0M in the last 90 days
- `@age/age-encryption` #936, 0M in the last 90 days (low confidence: unclear)

## Identifier case conversion

Convert strings between naming conventions such as camelCase, snake_case and kebab-case; Unicode case folding and case-insensitive comparison are out of scope.

- `@luca/cases` #194, 0M in the last 90 days
- `@furkankly/chalked-cases` #676, 0M in the last 90 days
- `@wok/case` #746, 0M in the last 90 days (low confidence: name only, no description)
- `@mesqueeb/case-anything` #951, 0M in the last 90 days

## Markdown rendering

Parse CommonMark-style Markdown text and render it to HTML or a syntax tree; converting HTML or office documents to Markdown, reStructuredText and terminal rendering are out of scope.

- `@deno/gfm` #113, 0M in the last 90 days
- `@littletof/charmd` #183, 0M in the last 90 days
- `@libs/markdown` #417, 0M in the last 90 days
- `@progfay/scrapbox-parser` #549, 0M in the last 90 days (low confidence: Scrapbox notation parser)

## Dependency injection containers

Register service providers in a container and resolve instances together with their transitive dependencies at run time; compile-time code generators, framework-bound module systems and plain service locators inside one framework are out of scope.

- `@fathym/ioc` #296, 0M in the last 90 days (low confidence: no description, name suggests IoC)
- `@arthur-fontaine/diabolo` #359, 0M in the last 90 days
- `@needle-di/core` #604, 0M in the last 90 days
- `@uri/inject` #771, 0M in the last 90 days

## Reactive signals

Fine-grained reactive primitives, such as signals, computed values, effects or observable objects, that propagate changes through a dependency graph; UI frameworks, framework-bound stores and plain event emitters are out of scope.

- `@libs/reactive` #405, 0M in the last 90 days (low confidence: observable utilities, vague)
- `@dnbkr/cygnals` #711, 0M in the last 90 days
- `@kling/react-store` #830, 0M in the last 90 days
- `@patrickjs/signals` #854, 0M in the last 90 days

## SMTP clients

Build an email message and submit it to a mail server over SMTP; IMAP and POP3 retrieval, vendor email API SDKs and SMTP servers are out of scope.

- `@upyo/core` #202, 0M in the last 90 days (low confidence: core of email library; transports are separate packages)
- `@upyo/smtp` #216, 0M in the last 90 days
- `@neabyte/deno-mailer` #480, 0M in the last 90 days
- `@skymethod/mimetext` #527, 0M in the last 90 days (low confidence: raw email builder only, no SMTP submit)

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `@std/json` #45, 0M in the last 90 days
- `@wr/flatted` #584, 0M in the last 90 days
- `@hugoalh/is-json` #603, 0M in the last 90 days (low confidence: JSON predicate only)

## Random number generation

Pseudo-random number generators that produce integers, floats and byte fills from a seed; OS entropy sources, random ID strings and statistical distributions are out of scope.

- `@std/random` #109, 0M in the last 90 days
- `@nekooftheabyss/fortuna` #848, 0M in the last 90 days
- `@chinese-character/random-chinese-character` #870, 0M in the last 90 days (low confidence: random character)

## Text diffing

Compute the line or element differences between two texts or sequences; edit-distance scores, assertion pretty-printers and structured JSON patches are out of scope.

- `@libs/diff` #226, 0M in the last 90 days
- `@coven/compare` #648, 0M in the last 90 days
- `@clearlylocal/diff-match-patch-unicode` #743, 0M in the last 90 days

## Image processing

Decode raster images, apply pixel operations such as resize and crop, and encode the result; single-format codecs, header-only size readers and OCR are out of scope.

- `@matmen/imagescript` #155, 0M in the last 90 days
- `@cross/image` #398, 0M in the last 90 days
- `@mary/exif-rm` #902, 0M in the last 90 days (low confidence: Unrecognized or unclear from description)

## HTTP application servers

Listen on a socket, parse HTTP requests and hand them to an application callback through the language's standard server interface (Rack, WSGI/ASGI and the like); routers, middleware, reverse proxies and process supervisors are out of scope.

- `@http/host-deno-local` #801, 0M in the last 90 days (low confidence: hosting helper)
- `@http/host-deno-deploy` #832, 0M in the last 90 days (low confidence: deploy hosting helper)
- `@geacko/serve-file` #838, 0M in the last 90 days (low confidence: static file handler)

## Redis clients

Speak the Redis protocol to send commands and decode replies; key namespacing wrappers, cache or session stores built on a client, in-memory fakes and job queues are out of scope.

- `@db/redis` #106, 0M in the last 90 days
- `@geacko/redis-client` #214, 0M in the last 90 days
- `@iuioiua/redis` #300, 0M in the last 90 days

## Message translation

Look up translated messages by key or source string in loaded catalogs, with interpolation and plural forms; locale data packages, framework glue and date or number formatting are out of scope.

- `@moductor/libintl` #244, 0M in the last 90 days
- `@axhxrx/internationalization` #370, 0M in the last 90 days
- `@locale-kit/locale-kit` #496, 0M in the last 90 days

## Semantic version comparison

Parse semantic version strings, order them and test them against range constraints; language-specific version schemes with no range syntax and dependency resolvers are out of scope.

- `@std/semver` #24, 0M in the last 90 days
- `@utility/version` #224, 0M in the last 90 days
- `@codemonument/zod-semver` #561, 0M in the last 90 days (low confidence: zod schema for semver strings, not comparison)

## ZIP archiving

Create ZIP archives from in-memory entries and read entries back out of them; tar archives, bare deflate or gzip codecs and other container formats are out of scope.

- `@zip-js/zip-js` #67, 0M in the last 90 days
- `@quentinadam/zip` #426, 0M in the last 90 days
- `@deno-library/compress` #547, 0M in the last 90 days

## QR code generation

Encode a text or byte payload into a QR code module matrix and render it as SVG, an image or text; QR code scanning and other barcode symbologies are out of scope.

- `@libs/qrcode` #234, 0M in the last 90 days
- `@levischuck/tiny-qr` #545, 0M in the last 90 days
- `@ghost/kjua-revived` #829, 0M in the last 90 days

## Cron expression scheduling

Parse cron expressions and compute the next matching run times, optionally firing callbacks on that schedule; persistent job queues, process managers and general date arithmetic are out of scope.

- `@hexagon/croner` #172, 0M in the last 90 days
- `@m4rc3l05/cron` #563, 0M in the last 90 days
- `@p4sca1/cron-schedule` #973, 0M in the last 90 days

## Terminal progress bars and spinners

Render a progress bar or spinner line for a running task and redraw it as the task advances; interactive prompts, full terminal UI toolkits and plain log output are out of scope.

- `@david/console-static-text` #107, 0M in the last 90 days (low confidence: redrawing static console text; close to progress rendering)
- `@deno-library/progress` #112, 0M in the last 90 days
- `@jonasschiano/kia` #965, 0M in the last 90 days

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `@std/fmt` #12, 1M in the last 90 days (low confidence: mixed formatting utilities: colors, durations, printf, bytes)
- `@cliffy/ansi` #65, 0M in the last 90 days

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `@std/tar` #53, 0M in the last 90 days
- `@mary/tar` #352, 0M in the last 90 days

## Indentation stripping

Remove common leading whitespace from multi-line strings; adding indentation, word wrapping and code formatting are out of scope.

- `@okikio/undent` #502, 0M in the last 90 days
- `@cspotcode/outdent` #548, 0M in the last 90 days

## Regular expression matching

Compile regular expressions and search text with them; regex syntax parsers on their own, glob matching and literal substring search are out of scope.

- `@shahriyardx/regex` #503, 0M in the last 90 days (low confidence: thin helper around regex checks)
- `@rregex/rregex` #504, 0M in the last 90 days

## Non-deflate compression

Compress and decompress byte buffers with a codec other than deflate, such as Zstandard, Brotli, LZ4, Snappy or bzip2; deflate, zlib and gzip framing and archive formats are out of scope.

- `@denosaurs/lz4` #342, 0M in the last 90 days
- `@nick/lz4` #929, 0M in the last 90 days

## PDF reading

Open existing PDF files and extract their text and page structure; creating new PDFs and rasterizing pages through external command-line tools are out of scope.

- `@pdf/pdftext` #200, 0M in the last 90 days
- `@lino/pdf-parse` #525, 0M in the last 90 days

## Text table rendering

Lay out rows of values as an aligned plain-text or ASCII table; full terminal UI toolkits, progress bars and spreadsheet files are out of scope.

- `@cliffy/table` #38, 0M in the last 90 days
- `@sauber/table` #66, 0M in the last 90 days

## Background job queues

Enqueue jobs to a persistent backend such as Redis or a database and execute them in worker processes or threads; in-process task pools, cron-style schedulers and message-broker clients are out of scope.

- `@fedify/amqp` #287, 0M in the last 90 days (low confidence: AMQP driver for Fedify)
- `@pgflow/edge-worker` #372, 0M in the last 90 days (low confidence: Postgres-backed workflow edge worker, empty description)

## Dotenv loading

Parse a .env file of KEY=value lines, with quoting and variable expansion, and load the pairs into the process environment or a map; decoding environment variables into typed structs and general INI or configuration managers are out of scope.

- `@std/dotenv` #19, 0M in the last 90 days
- `@danibix95/secretcfg` #915, 0M in the last 90 days (low confidence: Unrecognized or unclear from description)

## MongoDB clients

Speak the MongoDB wire protocol to run commands and encode and decode BSON documents; object-document mappers and drivers for other databases are out of scope.

- `@oridune/mongo` #609, 0M in the last 90 days (low confidence: Possibly an ODM, which is out of scope; unknown)
- `@db/mongo` #950, 0M in the last 90 days

## Path string manipulation

Normalize, join, split and relativize file system path strings purely in memory, including separator conversion between platforms; touching the file system, glob matching and URL parsing are out of scope.

- `@std/path` #6, 2M in the last 90 days
- `@david/path` #62, 0M in the last 90 days (low confidence: Path class mixing path manipulation and fs operations)

## CSV parsing

Parse delimited text with quoting and escaping into records and write records back as CSV; spreadsheet file formats, dataframes and fixed-width formats are out of scope.

- `@std/csv` #33, 0M in the last 90 days
- `@vslinko/csv` #236, 0M in the last 90 days

## Linear algebra and arrays

Dense vector, matrix and n-dimensional array types with element-wise arithmetic, matrix multiplication and decompositions; dataframes, arbitrary-precision numbers and machine learning frameworks are out of scope.

- `@maths/matrix` #499, 0M in the last 90 days
- `@zarrita/zarrita` #961, 0M in the last 90 days (low confidence: chunked n-dim arrays)

## SQLite clients

Open a SQLite database from the host language, run statements and decode result rows; object-relational mappers, query builders and drivers for database servers are out of scope.

- `@db/sqlite` #57, 0M in the last 90 days
- `@m4rc3l05/sqlite-tag` #485, 0M in the last 90 days (low confidence: sqlite query tag helper, unclear)

## Glob matching

Test whether path strings match a glob pattern, purely in memory; walking the filesystem, gitignore rule sets and brace-only expansion are out of scope.

- `@cfa/gitignore-parser` #912, 0M in the last 90 days

## HTML entity escaping

Escape and unescape HTML special characters and entities in strings; CSS, RegExp and JavaScript string escaping are out of scope.

- `@std/html` #36, 0M in the last 90 days

## Value inspection and formatting

Render arbitrary JavaScript values as human-readable strings for logs, assertions and snapshots; JSON serialization and diffing are out of scope.

- `@console/dump` #458, 0M in the last 90 days

## Object merging

Copy or recursively merge properties of source objects into a target object; cloning a single value, immutable-update libraries and Object.assign ponyfills are out of scope.

- `@cross/deepmerge` #171, 0M in the last 90 days

## Stream merging

Combine several readable streams into one output stream, in sequence or interleaved; stream class implementations and pipe/cleanup helpers are out of scope.

- `@std/streams` #18, 1M in the last 90 days (low confidence: Web Streams utilities incl. mergeReadableStreams, broader)

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `@alistair/pathcat` #884, 0M in the last 90 days

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `@quentinadam/decimal` #739, 0M in the last 90 days

## Color parsing and conversion

Parse CSS color strings and convert between color spaces such as RGB, HSL and Lab; terminal styling, named-color tables and interpolation are out of scope.

- `@omega/color` #367, 0M in the last 90 days

## Namespaced debug logging

Create named loggers that are switched on or off by an environment variable or pattern and format messages to a stream; structured log pipelines, console wrappers and telemetry SDKs are out of scope.

- `@sigma/dbg` #507, 0M in the last 90 days (low confidence: dbg macro port, prints values for debugging)

## Hash maps

General-purpose in-memory key-value hash tables, including insertion-ordered and concurrent variants; bounded caches, tries, slabs and the hash functions themselves are out of scope.

- `@vicary/flushable-set` #787, 0M in the last 90 days (low confidence: Set with max size and flush callback)

## LRU caches

Bounded in-memory key-value caches that evict the least recently used entry; unbounded maps, memoization decorators and remote cache clients are out of scope.

- `@std/cache` #124, 0M in the last 90 days (low confidence: @std/cache mixes memoize, LRU and TTL caches)

## Message channels

In-process queues that pass values between threads or async tasks with send and receive ends; event emitters, OS pipes and network sockets are out of scope.

- `@blowater/csp` #988, 0M in the last 90 days

## Checksums

Compute error-detecting checksums such as CRC-32, CRC-32C and Adler-32 over byte buffers; cryptographic digests and hash-table hashes are out of scope.

- `@deno-library/crc32` #517, 0M in the last 90 days

## TOML parsing

Parse TOML text into values or a document tree; JSON-superset formats such as YAML and JSON5, INI files and layered configuration loaders are out of scope.

- `@std/toml` #44, 0M in the last 90 days

## ASN.1 DER decoding

Parse and encode ASN.1 structures in BER or DER, including X.509 certificates; PEM text framing, certificate chain verification and TLS are out of scope.

- `@wildboar/asn1` #381, 0M in the last 90 days

## Immutable collections

Immutable or persistent maps, lists and sets whose updates return a new version, usually with structural sharing; mutable ordered, sorted or multi-value containers are out of scope.

- `@oxi/list` #600, 0M in the last 90 days

## Dataframes

In-memory columnar tables with filter, join, group-by and aggregate operations; compatibility layers over other dataframe libraries, file-format readers alone and remote warehouse clients are out of scope.

- `@nshiab/simple-data-analysis` #464, 0M in the last 90 days

## Subword tokenization

Encode text into the integer token ids of a trained subword vocabulary such as BPE or unigram, and decode them back; linguistic word tokenizers, stemmers and model inference are out of scope.

- `@wangb/vibrato-deno` #869, 0M in the last 90 days (low confidence: Japanese morphological tokenizer)

## WebSocket messaging

Implement the WebSocket protocol as a client, a server or a bring-your-own-I/O state machine and exchange framed messages; Socket.IO-style layers on top, server-sent events and raw HTTP are out of scope.

- `@babia/deko` #813, 0M in the last 90 days

## INI and properties parsing

Parse INI-style or Java .properties text of sections and name=value pairs into an in-memory structure; TOML, YAML and other JSON-superset formats, dotenv loading into the process environment and layered configuration managers are out of scope.

- `@std/ini` #105, 0M in the last 90 days

## Sorted maps and prefix trees

Mutable in-memory key-value containers that keep keys in sorted order, such as B-trees, radix trees and skip lists, and support ordered, range or prefix iteration; hash tables, persistent immutable variants, bounded caches and on-disk stores are out of scope.

- `@std/data-structures` #23, 0M in the last 90 days (low confidence: red-black tree and heap, mixed)

## Metrics instrumentation

In-process registries of counters, gauges, timers and histograms that application code updates and that render a snapshot for a monitoring system; standalone histogram data structures, distributed tracing and vendor agents that only ship data to one service are out of scope.

- `@wok/prometheus` #567, 0M in the last 90 days (low confidence: no description; prometheus metrics presumably)

## MIME type lookup

Map a file name or extension to its media type and a media type back to its extensions, using a built-in table; sniffing content from bytes and parsing media type header values are out of scope.

- `@std/media-types` #21, 0M in the last 90 days

## URI template expansion

Expand RFC 6570 URI templates with a set of variables into concrete URIs; route pattern matching of incoming paths and general URL parsing are out of scope.

- `@fedify/uri-template` #479, 0M in the last 90 days

## Temporary files and directories

Create uniquely named temporary files and directories and remove them when they are no longer needed; atomic replacement of existing files and in-memory file systems are out of scope.

- `@david/temp` #998, 0M in the last 90 days

## Spreadsheet file reading

Open existing spreadsheet workbook files such as XLSX or XLS and read their sheets and cell values; creating workbooks, CSV parsing and dataframes are out of scope.

- `@mirror/xlsx` #978, 0M in the last 90 days

## Number parsing

Parse decimal text into integer and floating-point machine numbers; formatting numbers as text, arbitrary-precision arithmetic and locale-aware or spelled-out numbers are out of scope.

- `@ghoullier/number-safe-parse` #88, 0M in the last 90 days

## Unicode text segmentation

Find grapheme cluster, word, sentence or line-break boundaries in text according to the Unicode segmentation rules; display width measurement, word wrapping and language-specific tokenizers are out of scope.

- `@hugoalh/string-dissect` #924, 0M in the last 90 days (low confidence: splits strings into emoji/URL/word parts)

## Character set transcoding

Decode bytes in a legacy character encoding such as Shift_JIS, GBK or windows-1252 to Unicode text and encode text back; guessing an unknown encoding, base64 and UTF-8 validation alone are out of scope.

- `@wildboar/teletex` #469, 0M in the last 90 days

## Noun pluralization

Turn English nouns into their plural or singular form using rules and irregular word lists; identifier case conversion, message translation and stemming for search are out of scope.

- `@wei/pluralize` #723, 0M in the last 90 days

## Unauthenticated symmetric ciphers

Encrypt and decrypt bytes with a bare block or stream cipher and its mode of operation, such as AES-CTR, AES-CBC, ChaCha20 or Salsa20; authenticated AEAD constructions, public-key cryptography and TLS are out of scope.

- `@roj/tgcrypto` #385, 0M in the last 90 days (low confidence: Telegram crypto (likely AES-IGE); name only)

## One-time passwords

Generate and verify HOTP and TOTP codes from a shared secret according to RFC 4226 and RFC 6238; password hashing, WebAuthn and full authentication frameworks are out of scope.

- `@hectorm/otpauth` #456, 0M in the last 90 days

## Single-format image codecs

Decode one raster image format such as PNG, JPEG, GIF, TIFF or WebP to a pixel buffer, and encode pixels back where supported; multi-format image toolkits with resize and crop operations and header-only size readers are out of scope.

- `@img/png` #78, 0M in the last 90 days

## Queues and linked lists

In-memory FIFO queues, deques, ring buffers and linked lists with push and pop at the ends; channels that pass values between threads, priority queues and persistent job queues are out of scope.

- `@cm-iv/stack` #918, 0M in the last 90 days

## DNS messages and resolution

Encode and decode DNS wire-format messages and resource records, and use them to query name servers; host name parsing, public suffix lookup and mDNS service discovery are out of scope.

- `@layered/dns-records` #582, 0M in the last 90 days (low confidence: DNS record lookup)

## Fake data generation

Generate realistic-looking fake values such as names, addresses, emails and dates for tests and fixtures; bare random number generators, unique ID generators and property-based testing frameworks are out of scope.

- `@laura/testdata-generator` #391, 0M in the last 90 days

## Embedded script interpreters

Run programs written in a scripting language such as JavaScript, Lua or Starlark inside the host process and exchange values with them; single-expression evaluators, template engines and bindings that only launch an external runtime binary are out of scope.

- `@eyurtsev/pyodide-sandbox` #770, 0M in the last 90 days

## Class name composition

Build an HTML class attribute string from a mix of strings, arrays and condition maps; resolving conflicts between utility classes and CSS-in-JS runtimes are out of scope.

- `@nick/clsx` #671, 0M in the last 90 days
