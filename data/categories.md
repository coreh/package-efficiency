# Package categories: npm

1000 of 1000 packages categorized into 107 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Runtime helpers and shims (`runtime-shims`) | 166 | no |  |
| Other (no peers yet) (`other`) | 128 | no |  |
| Build, lint and test tooling (`build-tooling`) | 91 | no |  |
| Library internals (`library-internals`) | 71 | no |  |
| Type definitions (`type-definitions`) | 54 | no |  |
| UI components and hooks (`ui-components`) | 51 | no |  |
| Tooling internals (AST and code utilities) (`tooling-internals`) | 45 | no |  |
| Service SDKs and telemetry (`service-sdks`) | 39 | no |  |
| Static data and patterns (`static-data`) | 31 | no |  |
| Environment detection (`environment-detection`) | 15 | no |  |
| Platform-specific binaries (`platform-binaries`) | 12 | no |  |
| Frameworks and broad libraries (`frameworks`) | 12 | no |  |
| CLI argument parsing (`cli-argument-parsing`) | 10 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| Terminal string styling (`terminal-styling`) | 9 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Async concurrency control (`async-concurrency`) | 9 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| Schema validation (`schema-validation`) | 8 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| File existence lookup (`file-lookup`) | 8 | yes | From a deep directory in a fixture tree, locate the nearest existing marker file among candidates in each ancestor directory. |
| JavaScript parsing (`javascript-parsing`) | 8 | yes | Parse the same large plain-JavaScript (ES2020, no JSX or types) source file into an AST. |
| Object merging (`object-merging`) | 8 | yes | Merge a fixed sequence of nested plain option objects into one result object, 100,000 times. |
| Config format parsing (`config-format-parsing`) | 7 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| Source map decoding (`source-map-decoding`) | 7 | yes | Load one large real-world source map and decode all of its mappings into position segments. |
| Module resolution (`module-resolution`) | 7 | yes | Resolve a fixed list of relative and bare package specifiers from a base directory inside a fixture node_modules tree. |
| HTTP clients (`http-client`) | 6 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| URL and URI parsing (`url-parsing`) | 6 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| Color parsing and conversion (`css-color-parsing`) | 6 | yes | Parse a fixed list of 100,000 hex, rgb() and hsl() color strings and convert each to an RGB triple. |
| Stream implementations (`stream-implementations`) | 5 | yes | Pipe a fixed number of fixed-size buffer chunks through a chain of passthrough streams to a counting sink. |
| HTML and XML parsing (`markup-parsing`) | 5 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| HTML entity escaping (`html-escaping`) | 5 | yes | Escape the five HTML special characters in 100,000 short strings of mixed text and markup. |
| JSON parsing (`json-parsing`) | 5 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| Deep equality (`deep-equality`) | 5 | yes | Compare a fixed set of equal and unequal pairs of nested objects, arrays, Maps and Dates. |
| Child process execution (`process-execution`) | 5 | yes | Spawn the same trivial command 200 times and collect its stdout and exit code. |
| Glob matching (`glob-matching`) | 4 | yes | Compile a fixed set of glob patterns and match each against a fixed list of 10,000 path strings. |
| CSS stylesheet parsing (`css-parsing`) | 4 | yes | Parse one large real-world stylesheet (for example a CSS framework build) into the package's AST. |
| Value inspection and formatting (`value-inspection`) | 4 | yes | Format a fixed set of nested objects, arrays, Maps, Sets and primitives into strings. |
| Filesystem globbing (`file-globbing`) | 4 | yes | Expand a fixed set of glob patterns such as **/*.js against a fixture directory tree and collect the matching paths. |
| Directory walking (`directory-walking`) | 4 | yes | Recursively list every file in a fixture tree of roughly 10,000 files across nested directories. |
| JWT signing and verification (`jwt-signing`) | 4 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 4 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| Terminal string width (`terminal-string-width`) | 4 | yes | Compute the display width of 100,000 strings mixing ASCII, CJK and emoji characters. |
| Indentation stripping (`indentation-stripping`) | 4 | yes | Strip the common leading indentation from 10,000 multi-line text blocks of varying depth. |
| Date and time (`date-time`) | 4 | yes | Parse 100,000 ISO 8601 timestamps, add calendar durations and format each back to a string. |
| Wrapping, slicing and stripping styled terminal text (`ansi-text-layout`) | 4 | yes | Take 10,000 lines of 200 visible columns with ANSI color codes every few words, strip the escape codes from each line and word-wrap each line to 80 columns, each member running the operations it offers. |
| Media type parsing (`media-type-parsing`) | 4 | yes | Parse and re-serialize 100,000 media type strings, half of them with charset and boundary parameters. |
| Deterministic JSON stringification (`stable-json-stringify`) | 3 | yes | Stringify a fixed set of large nested objects with shuffled key order into canonical JSON. |
| Event emitters (`event-emitter`) | 3 | yes | Register 10 listeners on each of several event names and emit one million events with two arguments. |
| Stream merging (`stream-merging`) | 3 | yes | Merge 100 readable streams of fixed buffer chunks into one stream and consume it to the end. |
| HTTP server routing (`http-server-routing`) | 3 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| Deflate compression (`deflate-compression`) | 3 | yes | Gzip and then gunzip the same 10 MB mixed text and binary buffer. |
| Tar archiving (`tar-archiving`) | 3 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Namespaced debug logging (`debug-logging`) | 3 | yes | Create 100 namespaced loggers, enable half of them, and log 100,000 formatted messages to a null sink. |
| Identifier case conversion (`case-conversion`) | 3 | yes | Convert 1,000,000 mixed identifiers to snake, camel and kebab case. |
| Retry policies (`retry-policies`) | 3 | yes | Wrap a function that fails a fixed number of times before succeeding and call it 100,000 times with zero delay. |
| Brace expansion (`brace-expansion`) | 3 | yes | Expand 10,000 fixed patterns that mix nested comma lists and numeric ranges, yielding about 1,000,000 strings in total. |
| Path string manipulation (`path-manipulation`) | 3 | yes | Normalize 100,000 path strings with mixed separators and dot segments, and compute the relative path between 100,000 pairs. |
| Unique ID generation (`id-generation`) | 2 | yes | Generate one million random unique IDs using the package's default secure generator. |
| LRU caches (`lru-cache`) | 2 | yes | Replay a fixed Zipf-distributed trace of 1,000,000 get/set operations against a cache capped at 10,000 entries. |
| Text diffing (`text-diff`) | 2 | yes | Diff pairs of 10,000-line text files that differ by 1%, 10% and 50% of their lines. |
| Markdown rendering (`markdown-parsing`) | 2 | yes | Render a fixed corpus of Markdown documents totalling several megabytes to HTML. |
| Image processing (`image-processing`) | 2 | yes | Decode a fixed set of JPEG and PNG photos, resize each to a thumbnail and re-encode it. |
| Text table rendering (`text-table-rendering`) | 2 | yes | Render a table of 10,000 rows and 8 mixed-type columns to a string. |
| Character encoding detection (`charset-detection`) | 2 | yes | Detect the encoding of a fixed corpus of 1,000 text files in assorted legacy and Unicode encodings. |
| Dotenv loading (`dotenv-loading`) | 2 | yes | Parse the same .env text of 1,000 assignments with quotes, comments and variable references into a key-value map. |
| File system watching (`file-watching`) | 2 | yes | Watch a directory tree of 1,000 files, apply a fixed script of 10,000 creates, writes and removes, and collect every resulting event. |
| Deep cloning (`deep-cloning`) | 2 | yes | Deep-copy the same nested value of 10,000 maps, lists and records 100 times and verify the copies share no mutable state. |
| Human-readable size formatting (`human-size-formatting`) | 2 | yes | Format a fixed list of 1,000,000 byte counts as human-readable sizes and parse each resulting string back to a number. |
| Edit distance and string similarity (`edit-distance`) | 2 | yes | Compute the Levenshtein distance for 100,000 fixed pairs of strings of 5 to 200 characters. |
| MIME type lookup (`mime-type-lookup`) | 2 | yes | Look up the media type for 100,000 file names drawn from 500 distinct extensions, then the default extension for 10,000 media types. |
| HTTP cookie parsing (`cookie-parsing`) | 2 | yes | Parse 100,000 Cookie headers of 10 pairs each and 100,000 Set-Cookie headers with attributes, then serialize them back to strings. |
| IP address and CIDR parsing (`ip-address-parsing`) | 2 | yes | Parse 100,000 IPv4 and IPv6 address strings and test each against 100 CIDR ranges. |
| IDNA and Punycode conversion (`idna-punycode`) | 2 | yes | Convert 100,000 Unicode domain names to ASCII and back to Unicode. |
| Source map generation (`source-map-generation`) | 2 | yes | Record 1,000,000 mappings across 100 source files and serialize the resulting source map to JSON. |
| CSS selector parsing (`css-selector-parsing`) | 2 | yes | Parse and re-serialize 100,000 selectors that mix compound selectors, combinators, attribute selectors and pseudo-classes. |
| Terminal progress bars and spinners (`terminal-progress-bars`) | 2 | yes | Advance a progress bar 1,000,000 times toward a fixed total while it renders to an in-memory, non-interactive stream. |
| Character set transcoding (`charset-transcoding`) | 2 | yes | Decode 10 MB of text in each of Shift_JIS, GBK and windows-1252 to Unicode and encode it back. |
| Queues and linked lists (`queues-and-linked-lists`) | 2 | yes | Push 10,000,000 items to the back and pop them from the front, keeping the queue at a steady length of 1,000. |
| Class name composition (`classname-composition`) | 2 | yes | Compose 1,000,000 class strings from 10 arguments each, mixing strings, nested arrays and condition objects. |
| Hash maps (`hash-maps`) | 1 | yes | Insert 1,000,000 integer and string keys, look each up, iterate, then remove half. |
| Non-cryptographic hashing (`non-cryptographic-hashing`) | 1 | yes | Hash 1,000,000 short keys and one 64 MB buffer to a 64-bit value. |
| Cryptographic hashing (`cryptographic-hashing`) | 1 | yes | Digest a 64 MB buffer and 100,000 64-byte messages with the package's primary algorithm. |
| Checksums (`checksums`) | 1 | yes | Checksum a 64 MB buffer in one call and again in 4 KB incremental updates. |
| Random number generation (`random-number-generation`) | 1 | yes | Seed a generator, draw 10,000,000 64-bit integers and fill a 64 MB buffer. |
| Base64 encoding (`base64-encoding`) | 1 | yes | Encode and decode a 16 MB buffer and 100,000 32-byte values with the standard alphabet. |
| Binary serialization (`binary-serialization`) | 1 | yes | Encode and decode 100,000 records with nested integers, strings and arrays. |
| Non-deflate compression (`block-compression`) | 1 | yes | Compress and decompress a fixed 32 MB mixed text and binary corpus at the default level. |
| System and foreign bindings (`system-bindings`) | 1 | no |  |
| HTML sanitizing (`html-sanitizing`) | 1 | yes | Sanitize a fixed set of 1,000 HTML fragments containing scripts, event handlers and unknown tags with a default allow-list. |
| CSS selector matching (`css-selector-matching`) | 1 | yes | Run a fixed list of 100 selectors against a parsed 1 MB HTML document and count the matches. |
| Immutable collections (`immutable-collections`) | 1 | yes | Build a 100,000-entry immutable map by successive inserts, then run a fixed mix of lookups and updates on it. |
| Structured logging (`structured-logging`) | 1 | yes | Log 1,000,000 records with five key-value fields each as JSON lines to a null sink. |
| File type detection (`file-type-detection`) | 1 | yes | Identify the type of each of 10,000 buffers holding the first bytes of files in 50 common formats. |
| WebSocket messaging (`websocket-messaging`) | 1 | yes | Echo 100,000 text and binary messages over a loopback connection, or through the codec in memory. |
| PostgreSQL clients (`postgres-client`) | 1 | yes | Against a local PostgreSQL server, insert 100,000 rows with a prepared statement and read them back. |
| User-agent parsing (`user-agent-parsing`) | 1 | yes | Parse a fixed list of 10,000 real-world User-Agent strings and read the browser name, version and platform of each. |
| Framework and tool extensions (`framework-extensions`) | 1 | no |  |
| Semantic version comparison (`semver-comparison`) | 1 | yes | Parse a fixed list of 10,000 version strings, sort them, and test each against a fixed set of range constraints. |
| Shell word splitting (`shell-word-splitting`) | 1 | yes | Split a fixed list of 100,000 command lines with mixed single quotes, double quotes and backslash escapes into their argument words. |
| Recursive file copying (`recursive-file-copy`) | 1 | yes | Copy a fixed directory tree of 10,000 small files in nested directories to an empty destination. |
| Reactive signals (`reactive-signals`) | 1 | yes | Build a fixed dependency graph of source values, derived values and effects, then apply a series of source updates and let each propagate. |
| Query string parsing (`query-string-parsing`) | 1 | yes | Parse 100,000 query strings of 20 percent-encoded key-value pairs each and serialize the results back to strings. |
| Percent encoding (`percent-encoding`) | 1 | yes | Encode and decode 100,000 strings of 100 characters, one third of which are reserved or non-ASCII characters. |
| Atomic file writing (`atomic-file-writing`) | 1 | yes | Atomically replace 1,000 files of 64 KiB each, 10 times over. |
| Temporary files and directories (`temporary-files`) | 1 | yes | Create 10,000 temporary files and 1,000 temporary directories, write 1 KiB to each file and clean everything up. |
| Number parsing (`number-parsing`) | 1 | yes | Parse 10,000,000 integer strings and 10,000,000 float strings of 1 to 20 significant digits. |
| Natural sort order (`natural-sorting`) | 1 | yes | Sort 1,000,000 strings that mix letters and digit runs into natural order. |
| Rate limiting (`rate-limiting`) | 1 | yes | Check 10,000,000 requests spread over 10,000 keys against a limit of 100 per second using an in-memory store. |
| SOCKS proxy clients (`socks-proxy-client`) | 1 | yes | Open 10,000 connections through a local SOCKS5 proxy to a local echo server and send 1 KB over each. |
| XML building (`xml-building`) | 1 | yes | Build and serialize a document of 1,000,000 elements, each with 3 attributes and a text node. |

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `tslib` #17, 1.7B per month
- `react-is` #24, 1.5B per month (low confidence: React element brand-check predicates; not clearly a shim)
- `has-flag` #31, 1.4B per month
- `safe-buffer` #41, 1.3B per month
- `path-key` #46, 1.2B per month
- `is-fullwidth-code-point` #58, 1.1B per month
- `string_decoder` #61, 1.1B per month
- `isarray` #67, 1.1B per month
- `hasown` #92, 916M per month
- `inherits` #103, 874M per month
- `function-bind` #113, 837M per month
- `is-stream` #117, 830M per month
- `get-intrinsic` #119, 818M per month
- `has-symbols` #122, 810M per month
- `@babel/runtime` #123, 808M per month
- `es-object-atoms` #126, 803M per month
- `es-errors` #130, 788M per month
- `gopd` #132, 785M per month
- `is-extglob` #143, 760M per month
- `is-glob` #147, 749M per month (low confidence: one-line-ish predicate; could be glob-matching helper)
- `es-define-property` #148, 746M per month
- `call-bind-apply-helpers` #149, 740M per month
- `is-number` #158, 722M per month
- `object-assign` #159, 722M per month
- `math-intrinsics` #160, 720M per month
- `buffer` #161, 720M per month (low confidence: Buffer polyfill, larger than a shim)
- `get-proto` #162, 719M per month
- `dunder-proto` #177, 698M per month
- `universalify` #181, 684M per month (low confidence: promise/callback adapter)
- `safer-buffer` #183, 682M per month
- `call-bound` #193, 659M per month
- `is-core-module` #198, 652M per month (low confidence: core module predicate)
- `util-deprecate` #219, 632M per month
- `concat-map` #220, 632M per month
- `has-tostringtag` #225, 628M per month
- `es-set-tostringtag` #241, 610M per month
- `path-parse` #288, 565M per month
- `supports-preserve-symlinks-flag` #292, 560M per month
- `setprototypeof` #297, 550M per month
- `is-plain-obj` #311, 533M per month
- `queue-microtask` #313, 530M per month
- `is-arrayish` #323, 520M per month
- `kind-of` #327, 516M per month
- `mimic-fn` #334, 508M per month
- `call-bind` #359, 486M per month
- `buffer-from` #374, 476M per month
- `has-property-descriptors` #387, 459M per month
- `object-keys` #395, 448M per month
- `which-typed-array` #397, 448M per month
- `is-regex` #398, 446M per month
- `define-data-property` #405, 441M per month
- `core-util-is` #408, 440M per month
- `use-sync-external-store` #410, 439M per month
- `p-try` #412, 437M per month
- `is-callable` #417, 432M per month
- `define-properties` #419, 428M per month
- `is-typed-array` #433, 421M per month
- `for-each` #436, 419M per month
- `set-function-length` #439, 417M per month
- `available-typed-arrays` #440, 416M per month
- `define-lazy-prop` #447, 414M per month (low confidence: Tiny lazy property helper)
- `es-abstract` #449, 413M per month
- `object.assign` #460, 406M per month
- `safe-regex-test` #463, 402M per month
- `fs.realpath` #466, 399M per month
- `path-is-absolute` #467, 397M per month
- `is-symbol` #475, 392M per month
- `is-generator-function` #486, 387M per month
- `regexp.prototype.flags` #491, 383M per month
- `es-to-primitive` #492, 383M per month
- `@swc/helpers` #494, 382M per month
- `is-number-object` #496, 381M per month
- `is-shared-array-buffer` #498, 378M per month
- `internal-slot` #506, 374M per month
- `string.prototype.trimend` #513, 372M per month
- `is-promise` #516, 371M per month
- `which-boxed-primitive` #517, 370M per month
- `functions-have-names` #519, 370M per month
- `is-boolean-object` #521, 370M per month
- `process-nextick-args` #523, 368M per month
- `typed-array-buffer` #527, 366M per month
- `function.prototype.name` #529, 366M per month
- `has-bigints` #537, 364M per month
- `is-bigint` #541, 363M per month
- `tiny-invariant` #544, 362M per month (low confidence: invariant assertion helper)
- `set-function-name` #546, 360M per month
- `string.prototype.trimstart` #547, 359M per month
- `string.prototype.trim` #548, 359M per month
- `array-buffer-byte-length` #551, 358M per month
- `safe-array-concat` #552, 358M per month
- `@smithy/is-array-buffer` #557, 355M per month
- `has-proto` #558, 355M per month
- `is-weakref` #561, 354M per month
- `is-array-buffer` #563, 354M per month
- `is-negative-zero` #565, 353M per month
- `typed-array-length` #573, 348M per month
- `is-weakset` #574, 347M per month
- `typed-array-byte-length` #577, 344M per month
- `is-map` #578, 344M per month
- `is-set` #583, 343M per month
- `is-string` #587, 340M per month
- `get-symbol-description` #590, 338M per month
- `data-view-buffer` #594, 337M per month
- `is-weakmap` #597, 335M per month
- `globalthis` #598, 335M per month
- `arraybuffer.prototype.slice` #600, 334M per month
- `reflect.getprototypeof` #601, 334M per month
- `data-view-byte-offset` #604, 333M per month
- `is-data-view` #605, 332M per month
- `is-async-function` #606, 332M per month
- `web-streams-polyfill` #615, 329M per month
- `which-builtin-type` #616, 329M per month
- `unbox-primitive` #618, 328M per month
- `data-view-byte-length` #627, 326M per month
- `@emnapi/core` #635, 324M per month (low confidence: wasm/napi runtime glue)
- `stop-iteration-iterator` #643, 320M per month
- `typed-array-byte-offset` #649, 317M per month
- `is-plain-object` #651, 316M per month
- `own-keys` #652, 316M per month
- `set-proto` #654, 315M per month
- `array-includes` #655, 315M per month
- `object.values` #664, 309M per month
- `safe-push-apply` #665, 309M per month
- `async-function` #673, 307M per month
- `es-shim-unscopables` #674, 306M per month
- `@emnapi/wasi-threads` #678, 306M per month (low confidence: WASI threads for emnapi)
- `@napi-rs/wasm-runtime` #679, 306M per month (low confidence: wasm runtime for napi-rs)
- `generator-function` #682, 304M per month
- `which-collection` #686, 304M per month
- `is-date-object` #687, 303M per month
- `detect-node-es` #691, 301M per month
- `array.prototype.flat` #694, 300M per month
- `destroy` #700, 299M per month
- `is-finalizationregistry` #702, 298M per month
- `get-nonce` #703, 298M per month (low confidence: tiny webpack nonce getter)
- `lodash.isplainobject` #706, 296M per month
- `regenerator-runtime` #713, 294M per month
- `object.fromentries` #714, 294M per month
- `is-path-inside` #744, 283M per month (low confidence: one-line path predicate)
- `boolbase` #774, 274M per month
- `abort-controller` #775, 273M per month
- `string.prototype.matchall` #778, 272M per month
- `type-detect` #798, 266M per month
- `array.prototype.flatmap` #800, 266M per month
- `node-domexception` #815, 261M per month
- `event-target-shim` #817, 261M per month
- `fetch-blob` #833, 256M per month
- `formdata-polyfill` #839, 254M per month
- `is-obj` #846, 252M per month
- `any-promise` #847, 252M per month
- `isobject` #853, 251M per month
- `setimmediate` #883, 242M per month
- `css.escape` #887, 239M per month
- `array.prototype.tosorted` #903, 235M per month
- `lodash.isboolean` #910, 233M per month
- `object.entries` #930, 230M per month
- `array.prototype.findlastindex` #965, 225M per month
- `jest-get-type` #966, 225M per month (low confidence: type predicate)
- `client-only` #969, 225M per month
- `@tybys/wasm-util` #972, 224M per month
- `lodash.isstring` #973, 224M per month
- `string.prototype.repeat` #980, 223M per month
- `lodash.once` #986, 222M per month (low confidence: once wrapper)
- `is-decimal` #992, 221M per month
- `is-buffer` #993, 221M per month
- `es-iterator-helpers` #997, 220M per month

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `ms` #7, 2.4B per month
- `balanced-match` #19, 1.7B per month
- `escape-string-regexp` #26, 1.5B per month
- `glob-parent` #32, 1.4B per month (low confidence: glob string parent extraction, not matching)
- `ignore` #36, 1.4B per month
- `signal-exit` #47, 1.2B per month
- `isexe` #52, 1.2B per month (low confidence: executable permission check, not candidate lookup)
- `agent-base` #59, 1.1B per month (low confidence: http.Agent base class for proxy agents)
- `https-proxy-agent` #65, 1.1B per month
- `shebang-command` #75, 1.0B per month
- `convert-source-map` #84, 941M per month (low confidence: source map container conversion, explicitly out of scope elsewhere)
- `path-to-regexp` #87, 933M per month (low confidence: route pattern to regexp)
- `negotiator` #100, 886M per month
- `get-stream` #101, 879M per month (low confidence: stream collection helper)
- `graceful-fs` #112, 842M per month
- `browserslist` #116, 832M per month
- `onetime` #139, 768M per month
- `jsesc` #144, 760M per month
- `form-data` #154, 733M per month
- `http-errors` #155, 730M per month
- `keyv` #178, 695M per month
- `callsites` #185, 675M per month
- `rimraf` #186, 673M per month
- `to-regex-range` #191, 666M per month
- `once` #196, 653M per month
- `import-fresh` #199, 649M per month
- `npm-run-path` #200, 648M per month
- `file-entry-cache` #203, 646M per month
- `finalhandler` #204, 645M per month
- `strip-bom` #208, 640M per month
- `levn` #211, 639M per month
- `depd` #216, 636M per month
- `accepts` #222, 628M per month
- `open` #224, 628M per month
- `content-disposition` #227, 626M per month
- `raw-body` #232, 619M per month
- `send` #236, 614M per month
- `gensync` #237, 612M per month
- `parent-module` #246, 608M per month
- `serve-static` #253, 600M per month
- `wrappy` #255, 598M per month
- `make-dir` #256, 598M per month
- `get-caller-file` #260, 591M per month
- `http-proxy-agent` #261, 591M per month
- `body-parser` #262, 590M per month
- `tapable` #266, 584M per month (low confidence: plugin hook system)
- `jsonfile` #268, 583M per month
- `fresh` #274, 580M per month
- `require-from-string` #276, 577M per month
- `cookie-signature` #277, 577M per month (low confidence: HMAC cookie signing)
- `on-finished` #278, 573M per month
- `source-map-support` #282, 570M per month
- `flat-cache` #284, 568M per month
- `range-parser` #293, 558M per month
- `require-directory` #301, 546M per month
- `ansi-escapes` #304, 543M per month
- `cosmiconfig` #305, 543M per month
- `mkdirp` #309, 538M per month
- `proxy-from-env` #322, 521M per month
- `lines-and-columns` #324, 520M per month
- `cli-cursor` #330, 512M per month
- `restore-cursor` #332, 512M per month
- `strip-final-newline` #333, 510M per month
- `dom-accessibility-api` #338, 504M per month
- `etag` #354, 489M per month
- `vary` #360, 484M per month
- `ieee754` #364, 481M per month
- `ee-first` #371, 478M per month (low confidence: tiny event helper, no peers)
- `pify` #375, 476M per month
- `proxy-addr` #386, 460M per month (low confidence: resolves client address from X-Forwarded-For with trust list; no peer)
- `indent-string` #389, 456M per month
- `@humanfs/node` #390, 455M per month (low confidence: filesystem abstraction bindings; no peer)
- `hosted-git-info` #407, 440M per month
- `forwarded` #411, 438M per month
- `sprintf-js` #427, 425M per month
- `data-uri-to-buffer` #445, 415M per month
- `data-urls` #455, 407M per month
- `error-ex` #458, 407M per month
- `d3-shape` #464, 401M per month (low confidence: path generators for SVG/canvas; no peer)
- `postcss-value-parser` #468, 397M per month
- `long` #493, 382M per month
- `why-is-node-running` #497, 379M per month
- `chownr` #502, 377M per month
- `is-binary-path` #524, 368M per month
- `w3c-xmlserializer` #525, 367M per month (low confidence: serializes DOM nodes to XML; not a builder)
- `d3-array` #536, 364M per month
- `cssesc` #559, 354M per month
- `d3-interpolate` #576, 345M per month
- `symbol-tree` #614, 330M per month (low confidence: tree/linked-list for DOM nodes; no clear peer)
- `d3-path` #647, 317M per month
- `@csstools/css-calc` #653, 315M per month
- `eventsource-parser` #656, 315M per month
- `ecdsa-sig-formatter` #669, 307M per month (low confidence: ECDSA signature DER/JOSE conversion; no peer)
- `@tanstack/query-core` #704, 298M per month (low confidence: query cache/state management; candidate state-management)
- `tailwind-merge` #708, 296M per month
- `nth-check` #716, 294M per month (low confidence: compiles nth-child expressions; no fit)
- `siginfo` #718, 293M per month (low confidence: prints messages on SIGINFO; no peer)
- `object-hash` #730, 288M per month (low confidence: hashes JS objects; not plain digest of bytes)
- `abbrev` #738, 285M per month
- `d3-ease` #747, 281M per month
- `d3-scale` #757, 280M per month
- `@inquirer/core` #767, 275M per month
- `d3-timer` #772, 274M per month
- `normalize-package-data` #773, 274M per month
- `@sindresorhus/is` #793, 267M per month
- `prompts` #811, 263M per month
- `array-union` #823, 259M per month
- `pkg-types` #834, 256M per month
- `proc-log` #857, 249M per month (low confidence: emits log events on process; no fit)
- `array-flatten` #865, 246M per month
- `require-in-the-middle` #889, 239M per month
- `unified` #890, 239M per month (low confidence: syntax-tree processing pipeline; no clear fit)
- `smart-buffer` #904, 234M per month
- `node-int64` #912, 233M per month
- `dot-prop` #935, 229M per month
- `space-separated-tokens` #937, 229M per month
- `dir-glob` #938, 228M per month
- `read-pkg` #939, 228M per month
- `@inquirer/confirm` #942, 228M per month
- `pathval` #945, 228M per month
- `ccount` #947, 227M per month
- `comma-separated-tokens` #954, 226M per month
- `stack-utils` #955, 226M per month
- `lie` #970, 224M per month
- `trough` #983, 222M per month
- `inflight` #984, 222M per month
- `thenify` #985, 222M per month
- `synckit` #996, 221M per month

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `postcss` #44, 1.2B per month
- `typescript` #48, 1.2B per month
- `esbuild` #51, 1.2B per month
- `@babel/core` #134, 780M per month
- `vite` #135, 780M per month
- `pnpm` #137, 772M per month (low confidence: package manager)
- `update-browserslist-db` #150, 739M per month
- `eslint` #187, 673M per month
- `jiti` #213, 638M per month
- `@eslint/js` #257, 595M per month
- `@typescript-eslint/parser` #272, 581M per month
- `@rolldown/pluginutils` #283, 569M per month
- `@typescript-eslint/eslint-plugin` #290, 562M per month
- `@eslint/eslintrc` #298, 550M per month
- `@vitest/spy` #300, 547M per month
- `rollup` #314, 530M per month
- `@eslint/core` #316, 526M per month
- `loose-envify` #317, 526M per month
- `tailwindcss` #335, 507M per month
- `@jest/schemas` #344, 499M per month (low confidence: jest config JSON schemas)
- `prettier` #346, 497M per month
- `@vitest/utils` #348, 496M per month
- `@eslint/plugin-kit` #349, 496M per month
- `@eslint/config-array` #357, 488M per month
- `jest-util` #361, 482M per month
- `@eslint/config-helpers` #370, 478M per month
- `@vitest/expect` #378, 470M per month
- `chai` #394, 449M per month
- `playwright-core` #399, 444M per month
- `@typescript-eslint/project-service` #402, 442M per month
- `vitest` #403, 442M per month
- `assertion-error` #404, 442M per month (low confidence: Test framework error class)
- `rolldown` #437, 418M per month
- `@vitest/mocker` #456, 407M per month
- `playwright` #459, 406M per month (low confidence: browser automation/testing framework)
- `@vitest/snapshot` #471, 395M per month
- `@vitejs/plugin-react` #474, 392M per month
- `get-tsconfig` #478, 390M per month (low confidence: finds and parses tsconfig.json; dev-time tooling)
- `@vitest/runner` #482, 389M per month
- `tinybench` #484, 387M per month (low confidence: benchmarking library, no peers)
- `tsx` #490, 383M per month
- `expect-type` #501, 378M per month (low confidence: type-level test assertions, no runtime task)
- `typescript-eslint` #532, 365M per month
- `eslint-plugin-react-hooks` #560, 354M per month
- `@tailwindcss/node` #566, 353M per month
- `@tailwindcss/oxide` #586, 341M per month (low confidence: no description; tailwind native engine)
- `terser` #588, 338M per month
- `@bcoe/v8-coverage` #623, 327M per month (low confidence: V8 coverage helper, test tooling)
- `istanbul-reports` #629, 326M per month
- `istanbul-lib-report` #646, 318M per month
- `@babel/plugin-syntax-jsx` #657, 313M per month
- `@babel/helper-create-class-features-plugin` #666, 308M per month
- `@testing-library/dom` #670, 307M per month
- `jest-matcher-utils` #683, 304M per month
- `@babel/helper-annotate-as-pure` #684, 304M per month
- `@babel/helper-member-expression-to-functions` #689, 302M per month
- `axe-core` #709, 295M per month (low confidence: a11y testing engine)
- `jest-mock` #729, 288M per month
- `@sinonjs/fake-timers` #739, 285M per month (low confidence: fake timers for tests)
- `@babel/plugin-transform-modules-commonjs` #746, 281M per month
- `@babel/plugin-transform-react-jsx-source` #752, 280M per month
- `@babel/plugin-transform-react-jsx-self` #755, 280M per month
- `@babel/plugin-syntax-typescript` #760, 279M per month
- `@playwright/test` #769, 275M per month
- `@rollup/pluginutils` #779, 272M per month
- `test-exclude` #781, 271M per month (low confidence: include/exclude path test for coverage tooling)
- `expect` #786, 270M per month
- `@testing-library/jest-dom` #791, 268M per month
- `autoprefixer` #792, 268M per month
- `jest-haste-map` #808, 265M per month (low confidence: file map for jest)
- `unplugin` #820, 260M per month
- `eslint-config-prettier` #830, 257M per month
- `eslint-plugin-import` #831, 256M per month
- `eslint-plugin-react` #836, 255M per month
- `@jest/transform` #856, 249M per month
- `babel-plugin-polyfill-corejs3` #861, 248M per month
- `@babel/plugin-syntax-import-attributes` #862, 248M per month
- `@jest/environment` #867, 245M per month (low confidence: jest internals)
- `@jest/fake-timers` #868, 245M per month
- `istanbul-lib-source-maps` #871, 245M per month (low confidence: coverage tooling)
- `@testing-library/react` #873, 244M per month
- `loader-utils` #874, 244M per month
- `webpack` #895, 238M per month
- `babel-plugin-istanbul` #908, 234M per month
- `babel-preset-jest` #946, 228M per month
- `@jest/console` #949, 227M per month (low confidence: jest internals)
- `babel-jest` #962, 226M per month
- `postcss-load-config` #968, 225M per month (low confidence: loads postcss config files)
- `napi-postinstall` #971, 224M per month (low confidence: postinstall helper for native bindings)
- `babel-plugin-jest-hoist` #974, 223M per month
- `jest-environment-node` #981, 223M per month

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `webidl-conversions` #86, 937M per month
- `scheduler` #136, 777M per month (low confidence: react scheduler)
- `y18n` #141, 761M per month (low confidence: yargs i18n helper)
- `side-channel` #165, 717M per month
- `side-channel-list` #206, 644M per month
- `side-channel-weakmap` #221, 630M per month
- `side-channel-map` #251, 602M per month
- `ajv-formats` #289, 562M per month (low confidence: Ajv plugin; no standalone task)
- `@humanwhocodes/module-importer` #296, 550M per month
- `reusify` #308, 539M per month (low confidence: object pool helper)
- `@nodelib/fs.stat` #312, 533M per month
- `@nodelib/fs.scandir` #325, 518M per month
- `delayed-stream` #341, 502M per month (low confidence: helper for combined-stream)
- `domutils` #372, 478M per month
- `unpipe` #373, 476M per month
- `dom-serializer` #381, 466M per month
- `domhandler` #384, 461M per month
- `@humanfs/core` #391, 454M per month (low confidence: Core of humanfs)
- `end-of-stream` #414, 436M per month
- `@emnapi/runtime` #444, 415M per month (low confidence: Runtime for emnapi native addon support)
- `domelementtype` #453, 408M per month
- `pump` #503, 376M per month (low confidence: stream piping helper)
- `ajv-keywords` #508, 373M per month (low confidence: ajv plugin keywords, not standalone)
- `package-json-from-dist` #522, 369M per month
- `xml-name-validator` #528, 366M per month (low confidence: jsdom XML name validator)
- `tldts-core` #531, 365M per month
- `jest-message-util` #562, 354M per month (low confidence: no description; jest sub-package)
- `jest-regex-util` #568, 351M per month (low confidence: no description; jest sub-package)
- `import-in-the-middle` #622, 327M per month
- `mimic-response` #660, 311M per month
- `@protobufjs/utf8` #697, 300M per month
- `pirates` #701, 298M per month
- `micromark-util-symbol` #725, 291M per month
- `micromark-util-character` #742, 284M per month
- `pg-protocol` #762, 278M per month
- `unist-util-visit` #766, 276M per month (low confidence: unist tree traversal helper)
- `unist-util-is` #777, 273M per month (low confidence: unist tree helper)
- `pg-types` #782, 271M per month
- `@protobufjs/path` #803, 265M per month
- `@protobufjs/float` #804, 265M per month
- `webpack-sources` #812, 263M per month
- `postgres-bytea` #818, 261M per month
- `vfile-message` #824, 259M per month
- `@babel/helper-replace-supers` #825, 259M per month
- `@protobufjs/aspromise` #827, 258M per month
- `@babel/helper-optimise-call-expression` #832, 256M per month
- `@protobufjs/codegen` #840, 254M per month
- `vfile` #854, 250M per month
- `pg-connection-string` #876, 243M per month (low confidence: pg sub-helper; connection string parser)
- `micromark-factory-space` #877, 243M per month
- `mdast-util-to-string` #879, 243M per month
- `micromark-util-sanitize-uri` #886, 239M per month
- `victory-vendor` #907, 234M per month
- `micromark-util-combine-extensions` #913, 233M per month
- `micromark-util-classify-character` #923, 231M per month
- `micromark-util-resolve-all` #926, 230M per month
- `check-error` #929, 230M per month (low confidence: chai util)
- `@sinonjs/commons` #931, 229M per month (low confidence: sinon shared helpers)
- `@protobufjs/base64` #932, 229M per month (low confidence: protobufjs sub-package)
- `zwitch` #933, 229M per month (low confidence: tiny unified/micromark helper)
- `@jest/expect-utils` #943, 228M per month
- `@jest/test-result` #948, 227M per month
- `micromark-core-commonmark` #950, 227M per month
- `micromark-factory-whitespace` #956, 226M per month
- `micromark-factory-label` #957, 226M per month
- `micromark-util-html-tag-name` #958, 226M per month
- `micromark-util-chunked` #964, 225M per month
- `@protobufjs/fetch` #978, 223M per month
- `postgres-date` #979, 223M per month
- `micromark-factory-destination` #988, 222M per month
- `@pkgr/core` #995, 221M per month (low confidence: shared core for @pkgr packages)

## Type definitions

Packages that ship only TypeScript types and have no runtime code.

- `@types/node` #15, 1.9B per month
- `type-fest` #21, 1.6B per month
- `undici-types` #37, 1.4B per month
- `@types/estree` #94, 900M per month
- `@typescript-eslint/types` #153, 738M per month (low confidence: types plus runtime enums)
- `csstype` #163, 719M per month
- `@oxc-project/types` #231, 620M per month
- `@types/react-dom` #258, 594M per month
- `@jest/types` #259, 594M per month
- `@types/json-schema` #263, 588M per month
- `@types/react` #270, 582M per month
- `@types/babel__traverse` #406, 441M per month
- `@types/babel__generator` #416, 432M per month
- `@types/unist` #434, 421M per month
- `@standard-schema/spec` #438, 418M per month (low confidence: Spec mostly types)
- `@types/babel__template` #476, 391M per month
- `@types/yargs` #480, 390M per month
- `@types/chai` #481, 389M per month
- `@types/babel__core` #483, 388M per month
- `@types/deep-eql` #579, 344M per month
- `@types/ms` #624, 327M per month
- `@humanfs/types` #631, 325M per month
- `@types/d3-time` #637, 323M per month
- `@types/d3-color` #640, 321M per month
- `@types/d3-interpolate` #644, 320M per month
- `@types/d3-array` #659, 311M per month
- `@octokit/types` #722, 292M per month
- `@types/d3-shape` #723, 292M per month
- `@types/d3-ease` #735, 286M per month
- `@types/express-serve-static-core` #763, 277M per month
- `@octokit/openapi-types` #768, 275M per month
- `@types/connect` #770, 275M per month
- `@types/send` #780, 272M per month
- `@types/d3-timer` #785, 271M per month
- `@types/ws` #790, 268M per month
- `@types/d3-scale` #794, 267M per month
- `@inquirer/type` #797, 266M per month
- `@types/d3-path` #806, 265M per month
- `hermes-estree` #810, 264M per month (low confidence: Flow types, may have runtime)
- `micromark-util-types` #813, 263M per month
- `@types/serve-static` #826, 259M per month
- `@types/aria-query` #837, 255M per month
- `@types/express` #841, 254M per month
- `@types/istanbul-reports` #843, 253M per month
- `@types/json5` #872, 245M per month
- `@types/istanbul-lib-coverage` #875, 244M per month
- `@types/body-parser` #911, 233M per month
- `@types/yargs-parser` #915, 232M per month
- `json-schema-typed` #919, 232M per month
- `@types/qs` #925, 230M per month
- `@types/range-parser` #936, 229M per month
- `@types/hast` #975, 223M per month
- `@types/debug` #982, 222M per month
- `@types/http-errors` #1000, 220M per month

## UI components and hooks

Browser UI component libraries, icon sets, positioning engines and React hooks, whose work is rendering and interaction rather than one standard computational task.

- `@radix-ui/react-slot` #145, 760M per month (low confidence: no description)
- `@radix-ui/react-primitive` #173, 707M per month (low confidence: no description)
- `@radix-ui/react-context` #358, 486M per month (low confidence: React context helper)
- `@radix-ui/react-compose-refs` #422, 427M per month
- `lucide-react` #435, 420M per month
- `@radix-ui/react-use-layout-effect` #442, 415M per month
- `@radix-ui/primitive` #443, 415M per month
- `@floating-ui/utils` #450, 413M per month
- `@floating-ui/core` #461, 406M per month
- `@radix-ui/react-use-controllable-state` #469, 396M per month
- `@floating-ui/dom` #479, 390M per month
- `@radix-ui/react-use-callback-ref` #500, 378M per month
- `@radix-ui/react-id` #514, 371M per month
- `@radix-ui/react-presence` #535, 364M per month
- `@floating-ui/react-dom` #542, 362M per month
- `@radix-ui/react-dismissable-layer` #543, 362M per month
- `@radix-ui/react-use-effect-event` #575, 346M per month
- `@radix-ui/react-focus-scope` #619, 328M per month
- `@radix-ui/react-focus-guards` #620, 328M per month
- `react-remove-scroll` #634, 324M per month
- `@radix-ui/react-direction` #648, 317M per month
- `aria-hidden` #662, 309M per month
- `@radix-ui/react-dialog` #667, 308M per month
- `use-sidecar` #675, 306M per month
- `use-callback-ref` #685, 304M per month
- `@radix-ui/react-use-size` #688, 303M per month
- `react-remove-scroll-bar` #695, 300M per month
- `@radix-ui/react-portal` #698, 300M per month
- `@radix-ui/react-popper` #699, 300M per month
- `@radix-ui/react-arrow` #711, 295M per month
- `@radix-ui/rect` #727, 289M per month
- `react-style-singleton` #728, 289M per month
- `@radix-ui/react-roving-focus` #734, 286M per month
- `@radix-ui/react-collection` #745, 282M per month
- `@radix-ui/react-visually-hidden` #751, 280M per month
- `@radix-ui/react-use-rect` #753, 280M per month
- `@tanstack/react-query` #801, 265M per month (low confidence: React data-fetching hooks; unclear fit)
- `@radix-ui/react-use-previous` #814, 262M per month
- `@radix-ui/react-tabs` #835, 255M per month
- `@radix-ui/react-dropdown-menu` #880, 242M per month
- `@radix-ui/react-popover` #882, 242M per month
- `@radix-ui/react-menu` #891, 239M per month
- `@radix-ui/react-separator` #897, 238M per month
- `react-hook-form` #902, 236M per month
- `recharts` #918, 232M per month
- `dom-helpers` #922, 231M per month
- `@radix-ui/react-label` #940, 228M per month
- `react-transition-group` #960, 226M per month
- `@radix-ui/react-collapsible` #961, 226M per month
- `@radix-ui/react-tooltip` #976, 223M per month
- `@radix-ui/react-toggle` #998, 220M per month

## Tooling internals (AST and code utilities)

Building blocks used inside compilers and linters, such as AST node helpers, traversal, scope analysis, tokenizing and code frames; standalone parsers are out of scope.

- `eslint-visitor-keys` #18, 1.7B per month
- `json-schema-traverse` #33, 1.4B per month (low confidence: schema traversal helper; excluded from schema-validation, nearest fit is internals)
- `@babel/code-frame` #63, 1.1B per month
- `js-tokens` #66, 1.1B per month
- `@babel/types` #74, 1.0B per month
- `@babel/helper-validator-identifier` #79, 983M per month
- `estraverse` #83, 964M per month
- `eslint-scope` #99, 891M per month
- `@babel/generator` #107, 865M per month
- `@babel/helper-string-parser` #109, 855M per month (low confidence: babel internal helper)
- `@babel/traverse` #111, 847M per month
- `estree-walker` #142, 761M per month
- `@babel/helpers` #156, 729M per month
- `@babel/template` #157, 722M per month
- `@babel/helper-module-transforms` #171, 710M per month
- `@typescript-eslint/visitor-keys` #172, 708M per month
- `esutils` #179, 691M per month
- `@typescript-eslint/scope-manager` #180, 684M per month
- `@babel/helper-plugin-utils` #184, 680M per month
- `es-module-lexer` #207, 644M per month
- `@typescript-eslint/utils` #210, 639M per month
- `@babel/helper-module-imports` #217, 633M per month
- `esquery` #226, 627M per month
- `@babel/helper-compilation-targets` #228, 623M per month
- `@babel/helper-validator-option` #230, 621M per month
- `esrecurse` #252, 602M per month
- `@eslint-community/regexpp` #271, 581M per month
- `@eslint-community/eslint-utils` #294, 557M per month
- `@typescript-eslint/type-utils` #302, 546M per month
- `@typescript-eslint/tsconfig-utils` #306, 541M per month
- `doctrine` #310, 535M per month (low confidence: JSDoc parser)
- `ts-api-utils` #337, 505M per month
- `@eslint/object-schema` #379, 467M per month (low confidence: ESLint config object merge/validate internals)
- `cjs-module-lexer` #396, 448M per month (low confidence: Lexer for CJS exports)
- `istanbul-lib-instrument` #567, 352M per month
- `istanbul-lib-coverage` #580, 343M per month (low confidence: coverage data model)
- `@csstools/css-tokenizer` #603, 334M per month
- `acorn-walk` #613, 330M per month
- `@babel/helper-skip-transparent-expression-wrappers` #720, 292M per month
- `ast-types` #759, 279M per month
- `unist-util-stringify-position` #776, 273M per month
- `unist-util-visit-parents` #802, 265M per month
- `jsx-ast-utils` #828, 258M per month
- `escodegen` #898, 237M per month (low confidence: code generator from AST)
- `regjsparser` #924, 231M per month (low confidence: regex syntax parser)

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `@opentelemetry/core` #239, 611M per month
- `@opentelemetry/api-logs` #285, 567M per month
- `@smithy/types` #319, 522M per month
- `@opentelemetry/resources` #336, 506M per month
- `@opentelemetry/semantic-conventions` #385, 460M per month
- `@aws-sdk/types` #421, 428M per month
- `@opentelemetry/instrumentation` #429, 424M per month
- `@smithy/util-utf8` #430, 423M per month
- `@aws-sdk/token-providers` #473, 393M per month
- `@aws-sdk/credential-provider-web-identity` #504, 375M per month
- `gcp-metadata` #510, 373M per month
- `@aws-sdk/credential-provider-process` #520, 370M per month
- `@smithy/node-http-handler` #530, 366M per month
- `@smithy/util-buffer-from` #539, 363M per month
- `@opentelemetry/api` #550, 359M per month
- `@aws-sdk/credential-provider-sso` #554, 358M per month
- `@opentelemetry/sdk-trace-base` #555, 357M per month
- `@smithy/fetch-http-handler` #556, 355M per month
- `@smithy/core` #570, 350M per month
- `@smithy/signature-v4` #571, 349M per month
- `google-auth-library` #596, 336M per month
- `@aws-sdk/core` #621, 328M per month
- `@aws-sdk/credential-provider-node` #658, 312M per month
- `@aws-sdk/credential-provider-http` #661, 311M per month
- `@aws-sdk/credential-provider-ini` #668, 308M per month
- `@smithy/credential-provider-imds` #676, 306M per month
- `@aws-sdk/xml-builder` #715, 294M per month
- `@aws-sdk/credential-provider-env` #726, 291M per month
- `@aws-sdk/nested-clients` #743, 283M per month
- `@grpc/proto-loader` #756, 280M per month (low confidence: gRPC proto loader)
- `@sentry/core` #789, 269M per month
- `@opentelemetry/sdk-metrics` #807, 265M per month
- `@aws/lambda-invoke-store` #809, 265M per month
- `@aws-sdk/signature-v4-multi-region` #821, 260M per month
- `@modelcontextprotocol/sdk` #917, 232M per month
- `@opentelemetry/sdk-logs` #920, 232M per month
- `@aws-sdk/credential-provider-login` #921, 231M per month
- `@grpc/grpc-js` #952, 227M per month (low confidence: gRPC protocol client/server)
- `@opentelemetry/otlp-transformer` #987, 222M per month

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `ansi-regex` #12, 2.1B per month
- `color-name` #23, 1.5B per month
- `emoji-regex` #29, 1.5B per month
- `mime-db` #49, 1.2B per month
- `globals` #56, 1.1B per month
- `shebang-regex` #80, 982M per month
- `caniuse-lite` #115, 834M per month
- `electron-to-chromium` #118, 822M per month
- `node-releases` #129, 792M per month
- `baseline-browser-mapping` #166, 714M per month (low confidence: data lookup library)
- `@babel/helper-globals` #188, 673M per month
- `@babel/compat-data` #197, 652M per month
- `statuses` #215, 637M per month (low confidence: HTTP status code table)
- `aria-query` #235, 616M per month
- `mdn-data` #326, 516M per month
- `human-signals` #367, 480M per month
- `log-symbols` #393, 449M per month (low confidence: Exports constant colored symbols)
- `binary-extensions` #470, 396M per month
- `possible-typed-array-names` #487, 386M per month
- `xmlchars` #507, 374M per month (low confidence: XML character class tables/regexes)
- `figures` #592, 337M per month
- `cli-spinners` #607, 332M per month
- `is-potential-custom-element-name` #612, 330M per month
- `methods` #783, 271M per month
- `@istanbuljs/schema` #844, 252M per month
- `axobject-query` #845, 252M per month (low confidence: accessibility lookup tables)
- `character-entities` #855, 250M per month
- `character-entities-legacy` #858, 249M per month
- `property-information` #894, 238M per month (low confidence: tables of HTML property info)
- `@inquirer/figures` #916, 232M per month (low confidence: constant figure symbols)
- `core-js-compat` #989, 222M per month

## Environment detection

One-shot probes of the host such as CPU count and features, terminal state, user, host name, time zone and standard directories, which return in constant time and have no workload to scale.

- `supports-color` #9, 2.1B per month
- `detect-libc` #105, 866M per month
- `ci-info` #269, 582M per month
- `is-docker` #307, 540M per month
- `is-wsl` #355, 489M per month
- `is-unicode-supported` #362, 482M per month
- `std-env` #401, 442M per month
- `env-paths` #511, 373M per month
- `is-interactive` #710, 295M per month
- `cli-width` #731, 288M per month
- `wsl-utils` #788, 269M per month (low confidence: WSL probes)
- `default-browser` #850, 251M per month
- `default-browser-id` #870, 245M per month
- `bundle-name` #884, 240M per month
- `is-inside-container` #885, 239M per month

## Platform-specific binaries

Packages that only carry a prebuilt native executable or addon for one OS and CPU architecture.

- `@esbuild/linux-x64` #89, 922M per month
- `lightningcss-linux-x64-gnu` #247, 606M per month
- `lightningcss-linux-x64-musl` #400, 443M per month
- `@rollup/rollup-linux-x64-gnu` #426, 425M per month
- `@img/sharp-linux-x64` #545, 361M per month
- `@rollup/rollup-linux-x64-musl` #602, 334M per month
- `@tailwindcss/oxide-linux-x64-gnu` #638, 322M per month
- `@img/sharp-libvips-linux-x64` #642, 320M per month
- `@rolldown/binding-linux-x64-gnu` #681, 305M per month
- `@tailwindcss/oxide-linux-x64-musl` #799, 266M per month
- `@rolldown/binding-linux-x64-musl` #892, 238M per month
- `@img/sharp-linuxmusl-x64` #994, 221M per month

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `react` #151, 738M per month
- `react-dom` #164, 718M per month
- `lodash` #175, 706M per month
- `prelude-ls` #244, 608M per month (low confidence: Functional utility library for LiveScript)
- `jsdom` #413, 437M per month
- `rxjs` #415, 433M per month
- `react-refresh` #538, 363M per month (low confidence: React hot-reload runtime)
- `core-js` #707, 296M per month
- `cssstyle` #764, 277M per month (low confidence: CSSOM piece of jsdom stack)
- `@hono/node-server` #822, 259M per month (low confidence: node adapter for Hono)
- `next` #864, 246M per month
- `react-router` #953, 226M per month (low confidence: React routing library)

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `commander` #10, 2.1B per month
- `argparse` #55, 1.1B per month
- `yargs-parser` #57, 1.1B per month
- `yargs` #60, 1.1B per month
- `minimist` #189, 670M per month
- `optionator` #205, 644M per month
- `jackspeak` #368, 479M per month
- `arg` #423, 427M per month
- `@pkgjs/parseargs` #589, 338M per month
- `nopt` #645, 319M per month

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `ansi-styles` #4, 2.9B per month
- `chalk` #13, 2.0B per month
- `picocolors` #76, 999M per month
- `tinyrainbow` #366, 481M per month
- `kleur` #409, 440M per month
- `colorette` #632, 325M per month
- `sisteransi` #692, 301M per month (low confidence: emits cursor/erase ANSI codes, not colors)
- `@colors/colors` #816, 261M per month
- `ansi-colors` #842, 254M per month

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `p-limit` #30, 1.4B per month
- `p-locate` #38, 1.4B per month (low confidence: first-match promise with concurrency)
- `fastq` #267, 583M per month
- `jest-worker` #340, 503M per month (low confidence: runs tasks in worker processes; loose fit)
- `asynckit` #350, 495M per month
- `run-parallel` #383, 463M per month (low confidence: Runs callbacks in parallel with no concurrency limit)
- `async` #462, 405M per month
- `p-map` #609, 332M per month
- `neo-async` #754, 280M per month

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `ajv` #20, 1.6B per month
- `zod` #64, 1.1B per month
- `type-check` #229, 621M per month (low confidence: Runtime type checking with a type-string syntax; closest to schema validation)
- `schema-utils` #342, 502M per month (low confidence: webpack options validation wrapper around ajv)
- `@sinclair/typebox` #369, 479M per month
- `prop-types` #388, 459M per month (low confidence: React prop runtime type checks; dev-only validator)
- `jest-validate` #851, 251M per month (low confidence: jest config validation)
- `json-schema` #906, 234M per month (low confidence: old JSON schema validator)

## File existence lookup

Find the first existing file or directory among candidate paths or by walking up parent directories; glob expansion, executable PATH lookup and module resolution are out of scope.

- `which` #34, 1.4B per month (low confidence: PATH lookup, excluded by file-lookup description)
- `find-up` #35, 1.4B per month
- `locate-path` #40, 1.3B per month
- `path-exists` #78, 993M per month
- `escalade` #110, 854M per month
- `path-type` #424, 426M per month (low confidence: Path type check via stat; closest to path-exists)
- `pkg-dir` #509, 373M per month
- `lilconfig` #584, 343M per month

## JavaScript parsing

Parse JavaScript source text into an ESTree-style AST; AST traversal, code generation and tokenizer-only packages are out of scope.

- `acorn` #69, 1.1B per month
- `@babel/parser` #102, 877M per month
- `espree` #167, 713M per month
- `@typescript-eslint/typescript-estree` #174, 707M per month (low confidence: TS parser to ESTree)
- `acorn-jsx` #248, 606M per month (low confidence: acorn plugin, parses JSX superset; not standalone)
- `esprima` #380, 467M per month
- `hermes-parser` #641, 321M per month
- `oxc-parser` #928, 230M per month

## Object merging

Copy or recursively merge properties of source objects into a target object; cloning a single value, immutable-update libraries and Object.assign ponyfills are out of scope.

- `lodash.merge` #320, 521M per month
- `merge-descriptors` #353, 492M per month
- `extend` #425, 426M per month
- `deepmerge` #465, 400M per month
- `xtend` #526, 367M per month
- `extend-shallow` #696, 300M per month
- `utils-merge` #771, 275M per month
- `defaults` #999, 220M per month

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `js-yaml` #43, 1.3B per month
- `json5` #77, 996M per month
- `strip-json-comments` #97, 896M per month
- `yaml` #114, 835M per month
- `ini` #212, 639M per month
- `jsonc-parser` #740, 285M per month
- `confbox` #934, 229M per month

## Source map decoding

Decode source map VLQ mappings and trace generated positions back to original ones; generating maps while editing code and converting map container formats are out of scope.

- `source-map` #22, 1.6B per month
- `@jridgewell/trace-mapping` #62, 1.1B per month
- `@jridgewell/sourcemap-codec` #88, 926M per month
- `source-map-js` #127, 798M per month
- `@jridgewell/remapping` #318, 526M per month (low confidence: merges sourcemaps; decodes and traces mappings, partly out of scope)
- `@jridgewell/source-map` #795, 267M per month
- `@cspotcode/source-map-support` #941, 228M per month (low confidence: stack trace remapping via source maps)

## Module resolution

Resolve a module specifier to a file path using the Node.js require algorithm from a given base directory; bundler-specific resolvers and loaders are out of scope.

- `resolve-from` #72, 1.0B per month
- `resolve` #81, 979M per month
- `enhanced-resolve` #254, 599M per month (low confidence: Webpack-oriented configurable resolver; bundler-specific resolvers are out of scope)
- `tsconfig-paths` #549, 359M per month (low confidence: resolves modules via tsconfig paths; unsure it fits Node algorithm)
- `resolve-pkg-maps` #599, 334M per month
- `eslint-import-resolver-node` #849, 251M per month (low confidence: eslint resolver wrapper around node resolve)
- `unrs-resolver` #909, 234M per month

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `node-fetch` #125, 806M per month
- `undici` #138, 770M per month
- `axios` #356, 489M per month
- `follow-redirects` #418, 430M per month
- `gaxios` #431, 422M per month
- `eventsource` #829, 258M per month (low confidence: SSE client, not plain request/response)

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `whatwg-url` #82, 967M per month
- `@jridgewell/resolve-uri` #140, 762M per month
- `uri-js` #192, 665M per month
- `fast-uri` #287, 565M per month
- `parseurl` #376, 475M per month
- `tldts` #515, 371M per month (low confidence: domain/public-suffix parsing from hostnames, not full URL parsing)

## Color parsing and conversion

Parse CSS color strings and convert between color spaces such as RGB, HSL and Lab; terminal styling, named-color tables and interpolation are out of scope.

- `color-convert` #27, 1.5B per month
- `d3-color` #625, 326M per month
- `@csstools/color-helpers` #663, 309M per month
- `@csstools/css-color-parser` #680, 305M per month
- `@asamuzakjp/css-color` #732, 287M per month
- `color-string` #991, 221M per month

## Stream implementations

Userland readable/writable/passthrough stream classes that data is piped through; helpers that only consume or collect an existing stream are out of scope.

- `readable-stream` #25, 1.5B per month
- `minipass` #73, 1.0B per month
- `mute-stream` #472, 394M per month (low confidence: mutable passthrough stream)
- `bl` #585, 341M per month
- `split2` #628, 326M per month (low confidence: line-splitting Transform stream)

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `parse5` #234, 616M per month
- `saxes` #448, 413M per month
- `htmlparser2` #451, 412M per month
- `sax` #488, 385M per month
- `fast-xml-parser` #593, 337M per month

## HTML entity escaping

Escape and unescape HTML special characters and entities in strings; CSS, RegExp and JavaScript string escaping are out of scope.

- `entities` #42, 1.3B per month
- `escape-html` #345, 498M per month
- `html-escaper` #534, 364M per month
- `micromark-util-encode` #859, 249M per month
- `decode-named-character-reference` #967, 225M per month

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `flatted` #190, 669M per month
- `parse-json` #264, 587M per month
- `json-buffer` #303, 543M per month (low confidence: JSON with binary/base64 support; loose fit)
- `json-parse-even-better-errors` #382, 465M per month
- `json-bigint` #951, 227M per month

## Deep equality

Compare two JavaScript values for structural equality; assertion libraries, diff output and shallow comparison are out of scope.

- `fast-deep-equal` #96, 900M per month
- `deep-is` #242, 610M per month
- `dequal` #457, 407M per month
- `deep-eql` #905, 234M per month
- `fast-equals` #977, 223M per month

## Child process execution

Spawn a child process and collect its exit status and output; shell-string quoting, PATH lookup and signal tables are out of scope.

- `cross-spawn` #68, 1.1B per month
- `execa` #170, 710M per month
- `tinyexec` #250, 603M per month
- `foreground-child` #392, 450M per month
- `run-applescript` #863, 246M per month (low confidence: runs osascript and returns output)

## Glob matching

Test whether path strings match a glob pattern, purely in memory; walking the filesystem, gitignore rule sets and brace-only expansion are out of scope.

- `minimatch` #3, 3.0B per month
- `picomatch` #14, 1.9B per month
- `micromatch` #182, 683M per month
- `anymatch` #363, 481M per month

## CSS stylesheet parsing

Parse a whole CSS stylesheet into an AST or object model; selector-only or value-only parsers, tokenizers and plugin-driven transformers are out of scope.

- `lightningcss` #240, 610M per month (low confidence: Parser plus transformer/minifier; parsing is only one part)
- `css-tree` #352, 493M per month
- `@csstools/css-parser-algorithms` #630, 326M per month
- `@adobe/css-tools` #866, 246M per month

## Value inspection and formatting

Render arbitrary JavaScript values as human-readable strings for logs, assertions and snapshots; JSON serialization and diffing are out of scope.

- `pretty-format` #93, 913M per month
- `object-inspect` #176, 703M per month
- `@vitest/pretty-format` #321, 521M per month
- `loupe` #963, 225M per month

## Filesystem globbing

Expand glob patterns into the list of matching paths by walking the filesystem; in-memory pattern matching and unfiltered directory crawling are out of scope.

- `glob` #28, 1.5B per month
- `tinyglobby` #108, 855M per month
- `fast-glob` #195, 653M per month
- `globby` #489, 384M per month

## Directory walking

Recursively enumerate every file and directory under a root; glob pattern expansion and file watching are out of scope.

- `readdirp` #106, 865M per month
- `fdir` #124, 808M per month
- `path-scurry` #146, 760M per month
- `@nodelib/fs.walk` #331, 512M per month

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `jose` #275, 579M per month
- `jws` #553, 358M per month
- `jwa` #677, 306M per month (low confidence: JWA sign/verify algorithms, lower-level than JWT)
- `jsonwebtoken` #888, 239M per month

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `decimal.js` #499, 378M per month
- `bn.js` #758, 279M per month
- `bignumber.js` #819, 260M per month
- `fraction.js` #860, 248M per month

## Terminal string width

Compute how many terminal columns a string or code point occupies, accounting for wide East Asian characters; wrapping, truncating and stripping styled text are out of scope.

- `string-width` #11, 2.1B per month
- `eastasianwidth` #533, 365M per month
- `get-east-asian-width` #581, 343M per month
- `cli-truncate` #990, 222M per month (low confidence: width-aware truncation)

## Indentation stripping

Remove common leading whitespace from multi-line strings; adding indentation, word wrapping and code formatting are out of scope.

- `strip-indent` #485, 387M per month
- `redent` #719, 293M per month
- `dedent` #733, 287M per month
- `min-indent` #796, 266M per month (low confidence: computes min indent only, not stripping)

## Date and time

Parse, format and do calendar arithmetic on dates, times and durations; time zone database packages, HTTP-date-only helpers and clock sources are out of scope.

- `date-fns` #452, 411M per month
- `d3-time` #626, 326M per month
- `dayjs` #705, 298M per month
- `d3-time-format` #736, 286M per month (low confidence: strftime/strptime formatter and parser)

## Wrapping, slicing and stripping styled terminal text

Transform strings that may contain ANSI escape codes by stripping the codes, word-wrapping to a column width, or slicing and truncating by visible columns; only measuring display width, adding color styles and stripping indentation are out of scope.

- `strip-ansi` #8, 2.2B per month
- `wrap-ansi` #16, 1.8B per month
- `word-wrap` #281, 571M per month
- `slice-ansi` #365, 481M per month

## Media type parsing

Parse a media type string such as a Content-Type header value into type, subtype and parameters and format it back; extension lookup tables, content sniffing and content negotiation are out of scope.

- `content-type` #120, 817M per month
- `type-is` #209, 639M per month
- `media-typer` #223, 628M per month
- `whatwg-mimetype` #299, 550M per month

## Deterministic JSON stringification

Serialize JavaScript values to JSON with a stable, sorted key order; pretty-printers for debugging and content hashing are out of scope.

- `fast-json-stable-stringify` #202, 647M per month
- `json-stable-stringify-without-jsonify` #286, 566M per month
- `safe-stable-stringify` #848, 251M per month

## Event emitters

In-process publish/subscribe objects with on/off/emit semantics; DOM EventTarget implementations, plugin hook systems and reactive streams are out of scope.

- `eventemitter3` #194, 657M per month
- `events` #564, 354M per month
- `@protobufjs/eventemitter` #737, 285M per month

## Stream merging

Combine several readable streams into one output stream, in sequence or interleaved; stream class implementations and pipe/cleanup helpers are out of scope.

- `merge2` #339, 504M per month
- `combined-stream` #347, 497M per month
- `merge-stream` #446, 414M per month

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `express` #291, 561M per month
- `router` #724, 292M per month
- `hono` #749, 281M per month

## Deflate compression

Compress and decompress byte buffers with deflate, zlib or gzip framing; archive formats and string-oriented LZ codecs are out of scope.

- `pako` #351, 495M per month
- `fflate` #582, 343M per month
- `minizlib` #611, 331M per month

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `tar-stream` #420, 428M per month
- `tar` #540, 363M per month
- `tar-fs` #869, 245M per month

## Namespaced debug logging

Create named loggers that are switched on or off by an environment variable or pattern and format messages to a stream; structured log pipelines, console wrappers and telemetry SDKs are out of scope.

- `debug` #2, 3.0B per month
- `google-logging-utils` #591, 338M per month
- `obug` #671, 307M per month

## Identifier case conversion

Convert strings between naming conventions such as camelCase, snake_case and kebab-case; Unicode case folding and case-insensitive comparison are out of scope.

- `camelcase` #133, 781M per month
- `toidentifier` #343, 500M per month (low confidence: words to camelCase identifier)
- `decamelize` #712, 295M per month

## Retry policies

Re-run a failing function according to a policy of attempts, backoff and jitter, or guard it with a circuit breaker; rate limiters, task queues and HTTP-client-specific transports are out of scope.

- `@humanwhocodes/retry` #328, 516M per month
- `retry` #377, 471M per month
- `p-retry` #959, 226M per month

## Brace expansion

Expand shell-style brace patterns such as a{b,c}d and {1..10} into the full list of strings; glob matching against paths and filesystem walking are out of scope.

- `brace-expansion` #5, 2.5B per month
- `fill-range` #168, 711M per month
- `braces` #169, 711M per month

## Path string manipulation

Normalize, join, split and relativize file system path strings purely in memory, including separator conversion between platforms; touching the file system, glob matching and URL parsing are out of scope.

- `pathe` #238, 611M per month
- `normalize-path` #273, 581M per month
- `slash` #279, 573M per month

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `uuid` #50, 1.2B per month
- `nanoid` #70, 1.0B per month

## LRU caches

Bounded in-memory key-value caches that evict the least recently used entry; unbounded maps, memoization decorators and remote cache clients are out of scope.

- `lru-cache` #6, 2.4B per month
- `@alloc/quick-lru` #741, 284M per month

## Text diffing

Compute the line or element differences between two texts or sequences; edit-distance scores, assertion pretty-printers and structured JSON patches are out of scope.

- `diff` #243, 609M per month
- `jest-diff` #636, 323M per month

## Markdown rendering

Parse CommonMark-style Markdown text and render it to HTML or a syntax tree; converting HTML or office documents to Markdown, reStructuredText and terminal rendering are out of scope.

- `marked` #639, 322M per month
- `mdast-util-from-markdown` #901, 237M per month

## Image processing

Decode raster images, apply pixel operations such as resize and crop, and encode the result; single-format codecs, header-only size readers and OCR are out of scope.

- `sharp` #441, 416M per month
- `pngjs` #852, 251M per month (low confidence: single-format PNG codec; image-processing excludes single-format codecs)

## Text table rendering

Lay out rows of values as an aligned plain-text or ASCII table; full terminal UI toolkits, progress bars and spreadsheet files are out of scope.

- `cliui` #71, 1.0B per month (low confidence: multi-column terminal layout; closest to text tables)
- `@isaacs/cliui` #454, 408M per month (low confidence: multi-column CLI layout)

## Character encoding detection

Guess the character encoding of a byte buffer of unknown text; transcoding between known encodings and encoding alias tables are out of scope.

- `html-encoding-sniffer` #432, 421M per month (low confidence: sniffs encoding per spec, not heuristic guessing)
- `chardet` #838, 255M per month

## Dotenv loading

Parse a .env file of KEY=value lines, with quoting and variable expansion, and load the pairs into the process environment or a map; decoding environment variables into typed structs and general INI or configuration managers are out of scope.

- `dotenv` #152, 738M per month
- `@next/env` #761, 278M per month

## File system watching

Subscribe to create, write, rename and remove notifications for files and directories through the operating system's notification facility; following the appended lines of one log file and polling build watchers tied to one tool are out of scope.

- `chokidar` #98, 894M per month
- `watchpack` #914, 232M per month

## Deep cloning

Produce an independent deep copy of an arbitrary in-memory value such as nested structs, maps and slices; merging several sources into one target, serialization to bytes and immutable collections are out of scope.

- `@ungap/structured-clone` #572, 348M per month
- `clone` #693, 301M per month

## Human-readable size formatting

Format byte counts and other quantities as short human-readable strings with unit suffixes such as 1.5 MiB, and parse such strings back to numbers; date and duration phrasing, locale-aware number formatting and arbitrary-precision arithmetic are out of scope.

- `bytes` #280, 571M per month
- `d3-format` #748, 281M per month (low confidence: number formatting with SI suffixes; loose fit)

## Edit distance and string similarity

Score how similar two strings are with Levenshtein, Jaro-Winkler or a related metric, or pick the closest match from a list; producing the actual diff hunks and phonetic or full-text search are out of scope.

- `fast-levenshtein` #245, 608M per month
- `leven` #765, 276M per month

## MIME type lookup

Map a file name or extension to its media type and a media type back to its extensions, using a built-in table; sniffing content from bytes and parsing media type header values are out of scope.

- `mime-types` #53, 1.1B per month
- `mime` #201, 647M per month

## HTTP cookie parsing

Parse Cookie and Set-Cookie header values into names, values and attributes and serialize them back; signing or encrypting cookie values and server session stores are out of scope.

- `cookie` #95, 900M per month
- `tough-cookie` #295, 554M per month

## IP address and CIDR parsing

Parse IPv4 and IPv6 address and CIDR network strings into values, and test whether an address falls inside a network; DNS lookups, socket handling and geolocation databases are out of scope.

- `ipaddr.js` #265, 585M per month
- `ip-address` #495, 381M per month

## IDNA and Punycode conversion

Convert internationalized domain names between Unicode and their ASCII Punycode form according to IDNA or UTS #46; public suffix lookup, full URL parsing and DNS resolution are out of scope.

- `punycode` #85, 939M per month
- `tr46` #90, 920M per month

## Source map generation

Build a source map by recording generated-to-original position mappings, or by tracking edits to a string, and encode it to the version 3 JSON form; decoding and tracing existing maps and converting between map container formats are out of scope.

- `magic-string` #91, 919M per month
- `@jridgewell/gen-mapping` #121, 817M per month

## CSS selector parsing

Parse CSS selector strings into a syntax tree and serialize the tree back; matching selectors against a document, parsing whole stylesheets and parsing property values are out of scope.

- `postcss-selector-parser` #329, 515M per month
- `css-what` #650, 317M per month

## Terminal progress bars and spinners

Render a progress bar or spinner line for a running task and redraw it as the task advances; interactive prompts, full terminal UI toolkits and plain log output are out of scope.

- `ora` #505, 375M per month
- `progress` #899, 237M per month

## Character set transcoding

Decode bytes in a legacy character encoding such as Shift_JIS, GBK or windows-1252 to Unicode text and encode text back; guessing an unknown encoding, base64 and UTF-8 validation alone are out of scope.

- `iconv-lite` #45, 1.2B per month
- `whatwg-encoding` #717, 294M per month

## Queues and linked lists

In-memory FIFO queues, deques, ring buffers and linked lists with push and pop at the ends; channels that pass values between threads, priority queues and persistent job queues are out of scope.

- `yallist` #39, 1.3B per month
- `yocto-queue` #128, 796M per month

## Class name composition

Build an HTML class attribute string from a mix of strings, arrays and condition maps; resolving conflicts between utility classes and CSS-in-JS runtimes are out of scope.

- `clsx` #315, 527M per month
- `class-variance-authority` #787, 270M per month

## Hash maps

General-purpose in-memory key-value hash tables, including insertion-ordered and concurrent variants; bounded caches, tries, slabs and the hash functions themselves are out of scope.

- `internmap` #617, 329M per month (low confidence: Map/Set with key interning)

## Non-cryptographic hashing

Fast hash functions for hash tables and fingerprints, such as FNV, xxHash, SipHash and Murmur; cryptographic digests and error-detecting checksums are out of scope.

- `imurmurhash` #233, 619M per month

## Cryptographic hashing

Compute cryptographic message digests such as SHA-1, SHA-2, SHA-3, BLAKE and MD5; HMAC, key derivation, password hashing and non-cryptographic hashes are out of scope.

- `@noble/hashes` #518, 370M per month

## Checksums

Compute error-detecting checksums such as CRC-32, CRC-32C and Adler-32 over byte buffers; cryptographic digests and hash-table hashes are out of scope.

- `buffer-crc32` #672, 307M per month

## Random number generation

Pseudo-random number generators that produce integers, floats and byte fills from a seed; OS entropy sources, random ID strings and statistical distributions are out of scope.

- `pure-rand` #690, 302M per month

## Base64 encoding

Encode bytes to base64 text and decode them back; hexadecimal, base58 and other alphabets, and PEM framing are out of scope.

- `base64-js` #218, 632M per month

## Binary serialization

Encode structured values to a compact binary format and decode them back, such as Protocol Buffers, MessagePack, CBOR and bincode; text formats, columnar data and byte-order helpers are out of scope.

- `protobufjs` #512, 372M per month

## Non-deflate compression

Compress and decompress byte buffers with a codec other than deflate, such as Zstandard, Brotli, LZ4, Snappy or bzip2; deflate, zlib and gzip framing and archive formats are out of scope.

- `lz-string` #750, 281M per month

## System and foreign bindings

Bindings to operating system APIs, C libraries and other language runtimes, whose work is done by the code they wrap; prebuilt per-platform import libraries are out of scope.

- `node-addon-api` #477, 391M per month

## HTML sanitizing

Strip disallowed tags, attributes and scripts from untrusted HTML according to an allow-list and return safe HTML; plain entity escaping and general HTML parsing are out of scope.

- `dompurify` #784, 271M per month

## CSS selector matching

Compile CSS selectors and find the matching elements in an already parsed HTML or XML tree; parsing whole stylesheets and parsing the document itself are out of scope.

- `css-select` #569, 350M per month

## Immutable collections

Immutable or persistent maps, lists and sets whose updates return a new version, usually with structural sharing; mutable ordered, sorted or multi-value containers are out of scope.

- `immer` #805, 265M per month (low confidence: copy-on-write drafts rather than persistent collections)

## Structured logging

Application loggers that format records with levels and key-value fields, as JSON or colored text, and write them to a sink; environment-switched debug loggers, telemetry exporters and vendor log shippers are out of scope.

- `consola` #881, 242M per month (low confidence: console logger wrapper)

## File type detection

Identify the format or media type of a file or buffer from its content and magic numbers; extension-to-MIME lookup tables and image dimension readers are out of scope.

- `file-type` #896, 238M per month

## WebSocket messaging

Implement the WebSocket protocol as a client, a server or a bring-your-own-I/O state machine and exchange framed messages; Socket.IO-style layers on top, server-sent events and raw HTTP are out of scope.

- `ws` #54, 1.1B per month

## PostgreSQL clients

Speak the PostgreSQL wire protocol to run queries and decode result rows; ORMs, query builders, connection-pool add-ons and drivers for other databases are out of scope.

- `pg` #900, 237M per month

## User-agent parsing

Parse an HTTP User-Agent header string into browser, version, operating system and device information; full request parsing and bot-blocking middleware are out of scope.

- `bowser` #878, 243M per month

## Framework and tool extensions

Plugins, engines, adapters, middleware and asset bundles that only work inside one host framework or tool, such as Rails engines, Rack middleware, OmniAuth strategies, Faraday adapters and Fluentd or Logstash plugins; the host frameworks themselves and build or test tooling plugins are out of scope.

- `cors` #610, 331M per month

## Semantic version comparison

Parse semantic version strings, order them and test them against range constraints; language-specific version schemes with no range syntax and dependency resolvers are out of scope.

- `semver` #1, 3.7B per month

## Shell word splitting

Split a command-line string into argument words following POSIX shell quoting and escaping rules, or quote words back into such a string; argv option parsing and spawning the command are out of scope.

- `shell-quote` #633, 324M per month

## Recursive file copying

Copy a file or a whole directory tree to a new location, preserving structure and modes; atomic single-file replacement, archive extraction and virtual file system abstractions are out of scope.

- `fs-extra` #104, 871M per month (low confidence: broad fs utility; only its copy function fits)

## Reactive signals

Fine-grained reactive primitives, such as signals, computed values, effects or observable objects, that propagate changes through a dependency graph; UI frameworks, framework-bound stores and plain event emitters are out of scope.

- `zustand` #944, 228M per month (low confidence: React state store)

## Query string parsing

Decode URL query strings or application/x-www-form-urlencoded bodies into key-value structures and encode them back; parsing the rest of the URL and multipart form bodies are out of scope.

- `qs` #131, 787M per month

## Percent encoding

Percent-encode arbitrary strings for use in a URL component and decode them back; splitting query strings into pairs, full URL parsing and Punycode are out of scope.

- `encodeurl` #214, 638M per month

## Atomic file writing

Write a file so that readers see either the old or the complete new content, by writing to a temporary file and renaming it into place; advisory file locking, plain file copy and temporary file creation alone are out of scope.

- `write-file-atomic` #428, 424M per month

## Temporary files and directories

Create uniquely named temporary files and directories and remove them when they are no longer needed; atomic replacement of existing files and in-memory file systems are out of scope.

- `tmp` #608, 332M per month

## Number parsing

Parse decimal text into integer and floating-point machine numbers; formatting numbers as text, arbitrary-precision arithmetic and locale-aware or spelled-out numbers are out of scope.

- `strnum` #721, 292M per month

## Natural sort order

Compare or sort strings so that embedded numbers are ordered by numeric value, as in file2 before file10; full locale-aware collation and semantic version ordering are out of scope.

- `natural-compare` #249, 604M per month

## Rate limiting

Decide whether an action for a given key is allowed now under a token bucket, leaky bucket or fixed-window limit; retry and backoff policies, concurrency limiters and gateway products are out of scope.

- `express-rate-limit` #927, 230M per month

## SOCKS proxy clients

Open TCP connections through a SOCKS4 or SOCKS5 proxy by performing the client side of the handshake; HTTP CONNECT proxies, SOCKS servers and SSH tunnels are out of scope.

- `socks-proxy-agent` #893, 238M per month

## XML building

Produce XML text from code through a builder interface or from nested native data structures; parsing XML, HTML template engines and DOM implementations are out of scope.

- `xmlbuilder` #595, 337M per month
