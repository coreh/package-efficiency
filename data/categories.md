# Package categories

1000 of 1000 packages categorized into 47 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Other (no peers yet) (`other`) | 270 | no |  |
| Runtime helpers and shims (`runtime-shims`) | 160 | no |  |
| Build, lint and test tooling (`build-tooling`) | 89 | no |  |
| Library internals (`library-internals`) | 57 | no |  |
| Type definitions (`type-definitions`) | 54 | no |  |
| UI components and hooks (`ui-components`) | 51 | no |  |
| Tooling internals (AST and code utilities) (`tooling-internals`) | 43 | no |  |
| Service SDKs and telemetry (`service-sdks`) | 39 | no |  |
| Static data and patterns (`static-data`) | 31 | no |  |
| Platform-specific binaries (`platform-binaries`) | 12 | no |  |
| Frameworks and broad libraries (`frameworks`) | 12 | no |  |
| CLI argument parsing (`cli-argument-parsing`) | 10 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| Terminal string styling (`terminal-styling`) | 9 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Schema validation (`schema-validation`) | 8 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| File existence lookup (`file-lookup`) | 8 | yes | From a deep directory in a fixture tree, locate the nearest existing marker file among candidates in each ancestor directory. |
| Object merging (`object-merging`) | 8 | yes | Merge a fixed sequence of nested plain option objects into one result object, 100,000 times. |
| Async concurrency control (`async-concurrency`) | 8 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| Config format parsing (`config-format-parsing`) | 7 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| Module resolution (`module-resolution`) | 7 | yes | Resolve a fixed list of relative and bare package specifiers from a base directory inside a fixture node_modules tree. |
| JavaScript parsing (`javascript-parsing`) | 7 | yes | Parse the same large plain-JavaScript (ES2020, no JSX or types) source file into an AST. |
| Source map decoding (`source-map-decoding`) | 6 | yes | Load one large real-world source map and decode all of its mappings into position segments. |
| HTTP clients (`http-client`) | 6 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| URL and URI parsing (`url-parsing`) | 6 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| Color parsing and conversion (`css-color-parsing`) | 6 | yes | Parse a fixed list of 100,000 hex, rgb() and hsl() color strings and convert each to an RGB triple. |
| HTML and XML parsing (`markup-parsing`) | 5 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| HTML entity escaping (`html-escaping`) | 5 | yes | Escape the five HTML special characters in 100,000 short strings of mixed text and markup. |
| JSON parsing (`json-parsing`) | 5 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| Deep equality (`deep-equality`) | 5 | yes | Compare a fixed set of equal and unequal pairs of nested objects, arrays, Maps and Dates. |
| Glob matching (`glob-matching`) | 4 | yes | Compile a fixed set of glob patterns and match each against a fixed list of 10,000 path strings. |
| CSS stylesheet parsing (`css-parsing`) | 4 | yes | Parse one large real-world stylesheet (for example a CSS framework build) into the package's AST. |
| Value inspection and formatting (`value-inspection`) | 4 | yes | Format a fixed set of nested objects, arrays, Maps, Sets and primitives into strings. |
| Filesystem globbing (`file-globbing`) | 4 | yes | Expand a fixed set of glob patterns such as **/*.js against a fixture directory tree and collect the matching paths. |
| Directory walking (`directory-walking`) | 4 | yes | Recursively list every file in a fixture tree of roughly 10,000 files across nested directories. |
| Child process execution (`process-execution`) | 4 | yes | Spawn the same trivial command 200 times and collect its stdout and exit code. |
| JWT signing and verification (`jwt-signing`) | 4 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 4 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| Terminal string width (`terminal-string-width`) | 4 | yes | Compute the display width of 100,000 strings mixing ASCII, CJK and emoji characters. |
| Indentation stripping (`indentation-stripping`) | 4 | yes | Strip the common leading indentation from 10,000 multi-line text blocks of varying depth. |
| Stream implementations (`stream-implementations`) | 3 | yes | Pipe a fixed number of fixed-size buffer chunks through a chain of passthrough streams to a counting sink. |
| Deterministic JSON stringification (`stable-json-stringify`) | 3 | yes | Stringify a fixed set of large nested objects with shuffled key order into canonical JSON. |
| Event emitters (`event-emitter`) | 3 | yes | Register 10 listeners on each of several event names and emit one million events with two arguments. |
| Stream merging (`stream-merging`) | 3 | yes | Merge 100 readable streams of fixed buffer chunks into one stream and consume it to the end. |
| HTTP server routing (`http-server-routing`) | 3 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| Deflate compression (`deflate-compression`) | 3 | yes | Gzip and then gunzip the same 10 MB mixed text and binary buffer. |
| Tar archiving (`tar-archiving`) | 3 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Namespaced debug logging (`debug-logging`) | 3 | yes | Create 100 namespaced loggers, enable half of them, and log 100,000 formatted messages to a null sink. |
| Unique ID generation (`id-generation`) | 2 | yes | Generate one million random unique IDs using the package's default secure generator. |

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `semver` #1, 3.7B/mo (low confidence: version parsing/comparison)
- `brace-expansion` #5, 2.5B/mo (low confidence: brace-only expansion)
- `lru-cache` #6, 2.4B/mo (low confidence: cache data structure)
- `ms` #7, 2.4B/mo (low confidence: duration string conversion)
- `strip-ansi` #8, 2.2B/mo (low confidence: ANSI stripping)
- `supports-color` #10, 2.1B/mo (low confidence: color support detection)
- `wrap-ansi` #16, 1.8B/mo (low confidence: ANSI-aware wrapping)
- `balanced-match` #19, 1.7B/mo (low confidence: balanced delimiter matching)
- `escape-string-regexp` #26, 1.5B/mo (low confidence: regexp escaping)
- `glob-parent` #32, 1.4B/mo (low confidence: glob base extraction)
- `ignore` #35, 1.4B/mo (low confidence: gitignore rule filtering)
- `yallist` #38, 1.3B/mo (low confidence: linked list data structure)
- `signal-exit` #46, 1.2B/mo (low confidence: process exit hooks)
- `iconv-lite` #48, 1.2B/mo (low confidence: character encoding conversion)
- `isexe` #52, 1.2B/mo (low confidence: executable check)
- `mime-types` #53, 1.2B/mo (low confidence: mime lookup)
- `ws` #54, 1.1B/mo (low confidence: websocket client/server)
- `agent-base` #60, 1.1B/mo (low confidence: http.Agent helper)
- `https-proxy-agent` #65, 1.1B/mo (low confidence: proxy http.Agent)
- `cliui` #70, 1.0B/mo (low confidence: terminal column layout)
- `shebang-command` #81, 969M/mo (low confidence: shebang parsing)
- `path-to-regexp` #84, 946M/mo (low confidence: route pattern to regexp)
- `convert-source-map` #85, 941M/mo (low confidence: source map format conversion)
- `punycode` #86, 939M/mo (low confidence: punycode conversion)
- `magic-string` #91, 919M/mo (low confidence: string editing with sourcemaps)
- `chokidar` #93, 908M/mo (low confidence: file watching)
- `tr46` #97, 891M/mo (low confidence: IDNA processing)
- `negotiator` #99, 886M/mo (low confidence: HTTP content negotiation)
- `get-stream` #100, 879M/mo (low confidence: stream consumption)
- `fs-extra` #103, 871M/mo (low confidence: fs helpers)
- `detect-libc` #104, 866M/mo (low confidence: libc detection)
- `cookie` #105, 866M/mo (low confidence: cookie parse/serialize)
- `graceful-fs` #111, 842M/mo (low confidence: fs wrapper with retries)
- `browserslist` #116, 832M/mo (low confidence: browser query resolution)
- `content-type` #120, 817M/mo (low confidence: HTTP header parse/format)
- `@jridgewell/gen-mapping` #121, 817M/mo (low confidence: source map generation)
- `yocto-queue` #128, 796M/mo (low confidence: queue data structure)
- `qs` #131, 783M/mo (low confidence: query string parse/stringify)
- `camelcase` #132, 781M/mo (low confidence: string case conversion)
- `onetime` #139, 768M/mo
- `is-extglob` #143, 760M/mo
- `jsesc` #144, 760M/mo
- `is-glob` #147, 749M/mo
- `dotenv` #152, 738M/mo
- `form-data` #154, 733M/mo
- `http-errors` #155, 730M/mo
- `is-number` #158, 722M/mo
- `fill-range` #159, 722M/mo
- `braces` #168, 711M/mo
- `keyv` #178, 695M/mo
- `callsites` #185, 675M/mo
- `rimraf` #186, 673M/mo
- `to-regex-range` #191, 666M/mo
- `once` #196, 653M/mo
- `import-fresh` #198, 649M/mo (low confidence: module cache-bypassing import)
- `npm-run-path` #199, 648M/mo
- `mime` #200, 647M/mo (low confidence: mime type mapping; could be static-data)
- `file-entry-cache` #202, 646M/mo
- `depd` #203, 646M/mo
- `finalhandler` #204, 645M/mo (low confidence: HTTP final responder middleware)
- `strip-bom` #208, 640M/mo
- `type-is` #210, 639M/mo
- `levn` #212, 639M/mo (low confidence: value notation parser)
- `base64-js` #217, 632M/mo
- `accepts` #221, 628M/mo
- `media-typer` #222, 628M/mo
- `content-disposition` #224, 626M/mo
- `raw-body` #229, 619M/mo
- `imurmurhash` #230, 619M/mo
- `encodeurl` #231, 619M/mo
- `send` #234, 614M/mo
- `gensync` #235, 612M/mo (low confidence: Generator-based sync/async helper; no peers)
- `pathe` #236, 611M/mo
- `open` #241, 610M/mo
- `diff` #242, 609M/mo
- `fast-levenshtein` #244, 608M/mo
- `acorn-jsx` #246, 606M/mo (low confidence: Acorn plugin for JSX; JSX excluded from javascript-parsing benchmark)
- `natural-compare` #247, 604M/mo
- `serve-static` #251, 600M/mo
- `wrappy` #252, 598M/mo (low confidence: Callback wrapping utility; no peers)
- `make-dir` #253, 598M/mo
- `get-caller-file` #256, 591M/mo
- `http-proxy-agent` #257, 591M/mo
- `body-parser` #258, 590M/mo
- `parent-module` #261, 588M/mo
- `ipaddr.js` #264, 585M/mo
- `tapable` #265, 584M/mo (low confidence: Plugin hook system; excluded from event-emitter)
- `jsonfile` #267, 583M/mo
- `ci-info` #268, 582M/mo
- `normalize-path` #272, 581M/mo
- `fresh` #273, 580M/mo
- `require-from-string` #275, 577M/mo
- `cookie-signature` #276, 577M/mo
- `on-finished` #278, 573M/mo
- `slash` #279, 573M/mo
- `word-wrap` #280, 571M/mo
- `source-map-support` #282, 570M/mo
- `flat-cache` #284, 568M/mo
- `tough-cookie` #289, 562M/mo
- `range-parser` #293, 558M/mo
- `whatwg-mimetype` #295, 557M/mo
- `cosmiconfig` #296, 554M/mo
- `bytes` #297, 554M/mo
- `@humanwhocodes/module-importer` #298, 550M/mo
- `require-directory` #302, 546M/mo
- `ansi-escapes` #305, 543M/mo
- `is-docker` #307, 540M/mo
- `reusify` #308, 539M/mo (low confidence: object pooling; no peers)
- `mkdirp` #309, 538M/mo
- `clsx` #318, 527M/mo
- `@jridgewell/remapping` #320, 526M/mo (low confidence: sourcemap remapping; source-map-generation-adjacent)
- `proxy-from-env` #323, 521M/mo
- `lines-and-columns` #325, 520M/mo
- `@humanwhocodes/retry` #328, 516M/mo
- `postcss-selector-parser` #329, 515M/mo
- `cli-cursor` #331, 512M/mo
- `restore-cursor` #332, 511M/mo
- `strip-final-newline` #333, 510M/mo
- `jest-worker` #336, 505M/mo (low confidence: parallel worker process pool; no peers)
- `toidentifier` #340, 500M/mo
- `dom-accessibility-api` #349, 494M/mo
- `delayed-stream` #351, 490M/mo (low confidence: stream buffering; no peers)
- `etag` #352, 489M/mo
- `is-wsl` #353, 489M/mo
- `vary` #359, 484M/mo
- `ieee754` #362, 481M/mo
- `slice-ansi` #363, 481M/mo
- `ee-first` #370, 478M/mo
- `retry` #372, 478M/mo
- `unpipe` #373, 476M/mo
- `pify` #375, 476M/mo
- `is-unicode-supported` #378, 469M/mo (low confidence: One-shot terminal capability probe (environment-detection candidate))
- `proxy-addr` #385, 460M/mo (low confidence: IP/proxy address determination; no peers)
- `indent-string` #389, 456M/mo
- `@humanfs/node` #390, 455M/mo (low confidence: Filesystem abstraction bindings; no peers)
- `std-env` #400, 442M/mo
- `hosted-git-info` #406, 440M/mo
- `forwarded` #409, 438M/mo
- `end-of-stream` #412, 436M/mo
- `write-file-atomic` #428, 424M/mo
- `html-encoding-sniffer` #431, 421M/mo
- `sharp` #440, 416M/mo
- `data-uri-to-buffer` #444, 415M/mo
- `sprintf-js` #447, 413M/mo
- `date-fns` #452, 411M/mo
- `@isaacs/cliui` #454, 408M/mo
- `data-urls` #455, 407M/mo
- `error-ex` #458, 407M/mo (low confidence: Error subclass helper, no peers)
- `d3-shape` #464, 401M/mo (low confidence: SVG path/shape generator, no peers)
- `node-addon-api` #466, 398M/mo (low confidence: native addon C++ API headers, no peers)
- `postcss-value-parser` #468, 397M/mo (low confidence: CSS value parser only; value-only parsers out of css-parsing)
- `mute-stream` #473, 394M/mo (low confidence: mutable passthrough-like stream wrapper; not clearly a stream implementation)
- `get-tsconfig` #478, 390M/mo (low confidence: tsconfig finder/parser; no peers)
- `long` #493, 382M/mo (low confidence: 64-bit integer class, excluded from arbitrary-precision)
- `ip-address` #495, 381M/mo
- `why-is-node-running` #497, 379M/mo (low confidence: debug helper for active handles, no peers)
- `chownr` #502, 377M/mo
- `pump` #503, 376M/mo (low confidence: stream pipe/cleanup helper, out of scope for other stream categories)
- `ora` #505, 375M/mo
- `env-paths` #511, 373M/mo
- `protobufjs` #513, 372M/mo
- `@noble/hashes` #520, 370M/mo
- `package-json-from-dist` #524, 369M/mo (low confidence: package.json loader, candidate package-json-reading)
- `is-binary-path` #526, 368M/mo (low confidence: binary path predicate based on extension list)
- `w3c-xmlserializer` #527, 367M/mo (low confidence: XML serializer, serializers out of scope for markup-parsing)
- `d3-array` #538, 364M/mo
- `cssesc` #558, 354M/mo
- `css-select` #567, 350M/mo
- `@ungap/structured-clone` #571, 348M/mo
- `xmlbuilder` #593, 337M/mo
- `d3-interpolate` #597, 334M/mo
- `tmp` #606, 332M/mo
- `cors` #608, 331M/mo (low confidence: CORS middleware, single purpose)
- `symbol-tree` #611, 330M/mo (low confidence: tree/linked-list structure)
- `internmap` #614, 329M/mo (low confidence: Map with key interning)
- `import-in-the-middle` #619, 327M/mo
- `d3-time` #623, 326M/mo
- `split2` #625, 326M/mo
- `shell-quote` #631, 324M/mo
- `jest-diff` #633, 323M/mo
- `marked` #636, 322M/mo
- `d3-path` #644, 317M/mo
- `css-what` #647, 317M/mo
- `eventsource-parser` #648, 317M/mo
- `@csstools/css-calc` #650, 315M/mo (low confidence: CSS calc solver; no peers)
- `mimic-response` #656, 311M/mo (low confidence: copies HTTP response properties onto stream; no peers)
- `ecdsa-sig-formatter` #664, 307M/mo (low confidence: ECDSA DER/JOSE signature conversion; jwt helper)
- `buffer-crc32` #667, 307M/mo
- `pure-rand` #686, 302M/mo
- `clone` #688, 301M/mo
- `decamelize` #691, 300M/mo
- `pirates` #696, 298M/mo
- `tailwind-merge` #701, 296M/mo
- `is-interactive` #703, 295M/mo (low confidence: tty interactivity probe; environment-detection candidate)
- `nth-check` #707, 294M/mo (low confidence: CSS nth-child compiler; no peers)
- `whatwg-encoding` #708, 294M/mo
- `siginfo` #709, 293M/mo
- `strnum` #713, 292M/mo
- `@tanstack/query-core` #718, 291M/mo
- `cli-width` #723, 288M/mo
- `d3-time-format` #728, 286M/mo
- `abbrev` #730, 285M/mo
- `@alloc/quick-lru` #733, 284M/mo
- `is-path-inside` #735, 283M/mo
- `@csstools/css-tokenizer` #737, 282M/mo (low confidence: CSS tokenizer only; excluded from css-parsing)
- `d3-ease` #740, 281M/mo
- `d3-format` #741, 281M/mo
- `lz-string` #743, 281M/mo
- `d3-scale` #750, 280M/mo
- `@next/env` #754, 278M/mo
- `leven` #758, 276M/mo
- `@inquirer/core` #759, 275M/mo
- `d3-timer` #764, 274M/mo
- `normalize-package-data` #765, 274M/mo
- `dompurify` #775, 271M/mo
- `object-hash` #777, 271M/mo
- `class-variance-authority` #779, 270M/mo
- `dayjs` #780, 269M/mo
- `wsl-utils` #788, 266M/mo
- `immer` #800, 265M/mo
- `prompts` #806, 263M/mo
- `postgres-bytea` #813, 261M/mo
- `array-union` #820, 259M/mo
- `pkg-types` #830, 256M/mo
- `chardet` #834, 255M/mo
- `default-browser` #848, 251M/mo
- `pngjs` #850, 251M/mo
- `proc-log` #855, 249M/mo
- `default-browser-id` #856, 249M/mo
- `loader-utils` #859, 248M/mo (low confidence: webpack-specific loader helpers, no peers)
- `array-flatten` #863, 246M/mo
- `run-applescript` #864, 246M/mo
- `bowser` #878, 243M/mo
- `consola` #881, 242M/mo
- `bundle-name` #884, 240M/mo
- `is-inside-container` #885, 239M/mo
- `require-in-the-middle` #889, 239M/mo
- `socks-proxy-agent` #891, 238M/mo
- `file-type` #894, 238M/mo
- `progress` #897, 237M/mo
- `pg` #898, 237M/mo
- `mdast-util-from-markdown` #900, 237M/mo
- `smart-buffer` #903, 234M/mo
- `node-int64` #911, 233M/mo
- `unified` #912, 233M/mo (low confidence: unified syntax tree processor, no peers)
- `watchpack` #914, 232M/mo
- `space-separated-tokens` #919, 231M/mo
- `regjsparser` #921, 231M/mo
- `express-rate-limit` #925, 230M/mo
- `@protobufjs/base64` #930, 229M/mo
- `comma-separated-tokens` #932, 229M/mo
- `dot-prop` #936, 229M/mo
- `dir-glob` #939, 228M/mo (low confidence: dirs to glob strings; no peers)
- `read-pkg` #940, 228M/mo (low confidence: read package.json)
- `@inquirer/confirm` #943, 228M/mo (low confidence: CLI prompt; candidate cli-prompts)
- `zustand` #945, 228M/mo (low confidence: state management store; candidate state-management)
- `pathval` #946, 228M/mo (low confidence: object path getter; candidate object-path-access)
- `ccount` #948, 227M/mo (low confidence: substring counting)
- `jest-get-type` #952, 226M/mo (low confidence: runtime type check; candidate type-checking)
- `stack-utils` #953, 226M/mo (low confidence: stack trace cleaning)
- `p-retry` #958, 226M/mo (low confidence: retry policy; out of async-concurrency scope)
- `check-error` #965, 225M/mo (low confidence: error comparison utilities)
- `client-only` #966, 225M/mo (low confidence: marker package)
- `lie` #967, 224M/mo (low confidence: promise implementation; candidate promise-implementations)
- `postgres-date` #977, 223M/mo (low confidence: postgres date parser)
- `trough` #982, 222M/mo (low confidence: middleware pipeline runner)
- `inflight` #983, 222M/mo (low confidence: dedupe in-flight async calls)
- `thenify` #984, 222M/mo (low confidence: promisify; candidate promisification)
- `synckit` #995, 221M/mo (low confidence: sync wrapper over worker threads)
- `@sindresorhus/is` #1000, 220M/mo (low confidence: type checking; candidate type-checking)

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `tslib` #17, 1.7B/mo
- `react-is` #24, 1.5B/mo (low confidence: React element brand-check predicates; not clearly a shim)
- `has-flag` #31, 1.4B/mo
- `safe-buffer` #41, 1.3B/mo
- `path-key` #45, 1.2B/mo
- `is-fullwidth-code-point` #58, 1.1B/mo
- `string_decoder` #59, 1.1B/mo
- `isarray` #74, 1.0B/mo
- `hasown` #92, 916M/mo
- `inherits` #102, 874M/mo
- `function-bind` #112, 837M/mo
- `is-stream` #117, 830M/mo
- `get-intrinsic` #119, 818M/mo
- `has-symbols` #122, 810M/mo
- `@babel/runtime` #123, 808M/mo
- `es-object-atoms` #126, 803M/mo
- `es-errors` #130, 788M/mo
- `gopd` #146, 759M/mo
- `es-define-property` #148, 746M/mo
- `call-bind-apply-helpers` #149, 740M/mo
- `object-assign` #160, 722M/mo
- `math-intrinsics` #161, 720M/mo
- `buffer` #162, 720M/mo (low confidence: Buffer polyfill, larger than a shim)
- `get-proto` #163, 719M/mo
- `dunder-proto` #177, 698M/mo
- `universalify` #181, 684M/mo (low confidence: promise/callback adapter)
- `safer-buffer` #188, 670M/mo
- `call-bound` #193, 659M/mo
- `is-core-module` #209, 640M/mo (low confidence: core module predicate)
- `util-deprecate` #218, 632M/mo
- `concat-map` #219, 632M/mo
- `has-tostringtag` #223, 628M/mo
- `es-set-tostringtag` #239, 610M/mo
- `path-parse` #288, 565M/mo
- `supports-preserve-symlinks-flag` #292, 560M/mo
- `setprototypeof` #299, 550M/mo
- `is-plain-obj` #311, 533M/mo
- `queue-microtask` #316, 530M/mo
- `kind-of` #319, 526M/mo
- `is-arrayish` #324, 520M/mo
- `mimic-fn` #334, 508M/mo
- `call-bind` #357, 486M/mo
- `buffer-from` #374, 476M/mo
- `has-property-descriptors` #386, 459M/mo
- `object-keys` #394, 448M/mo
- `which-typed-array` #396, 448M/mo
- `is-regex` #397, 446M/mo
- `define-data-property` #404, 441M/mo
- `core-util-is` #407, 440M/mo
- `use-sync-external-store` #408, 439M/mo
- `p-try` #410, 437M/mo
- `define-properties` #418, 428M/mo
- `is-callable` #421, 428M/mo
- `is-typed-array` #432, 421M/mo
- `for-each` #435, 419M/mo
- `set-function-length` #438, 417M/mo
- `define-lazy-prop` #446, 414M/mo (low confidence: Tiny lazy property helper)
- `es-abstract` #449, 413M/mo
- `available-typed-arrays` #450, 412M/mo
- `object.assign` #460, 406M/mo
- `safe-regex-test` #463, 402M/mo
- `path-is-absolute` #467, 397M/mo
- `fs.realpath` #469, 396M/mo
- `is-symbol` #476, 392M/mo
- `is-generator-function` #486, 387M/mo
- `regexp.prototype.flags` #491, 383M/mo
- `es-to-primitive` #492, 383M/mo
- `@swc/helpers` #494, 382M/mo
- `is-number-object` #496, 381M/mo
- `is-shared-array-buffer` #498, 378M/mo
- `internal-slot` #506, 374M/mo
- `string.prototype.trimend` #514, 372M/mo
- `is-promise` #518, 371M/mo
- `which-boxed-primitive` #519, 370M/mo
- `functions-have-names` #521, 370M/mo
- `is-boolean-object` #523, 370M/mo
- `process-nextick-args` #525, 368M/mo
- `typed-array-buffer` #529, 366M/mo
- `function.prototype.name` #531, 366M/mo
- `tiny-invariant` #533, 366M/mo (low confidence: invariant assertion helper)
- `has-bigints` #539, 364M/mo
- `is-bigint` #543, 363M/mo
- `set-function-name` #546, 360M/mo
- `string.prototype.trimstart` #547, 359M/mo
- `array-buffer-byte-length` #550, 358M/mo
- `safe-array-concat` #551, 358M/mo
- `@smithy/is-array-buffer` #555, 355M/mo
- `has-proto` #556, 355M/mo
- `is-weakref` #561, 354M/mo
- `is-array-buffer` #563, 354M/mo
- `is-negative-zero` #565, 353M/mo
- `typed-array-byte-length` #569, 349M/mo
- `typed-array-length` #572, 348M/mo
- `is-map` #574, 344M/mo
- `is-weakset` #576, 343M/mo
- `is-set` #580, 343M/mo
- `is-string` #585, 340M/mo
- `get-symbol-description` #588, 338M/mo
- `data-view-buffer` #592, 337M/mo
- `is-weakmap` #595, 335M/mo
- `globalthis` #596, 335M/mo
- `arraybuffer.prototype.slice` #599, 334M/mo
- `reflect.getprototypeof` #600, 334M/mo
- `data-view-byte-offset` #602, 333M/mo
- `is-data-view` #603, 332M/mo
- `is-async-function` #604, 332M/mo
- `which-builtin-type` #613, 329M/mo
- `unbox-primitive` #615, 328M/mo
- `data-view-byte-length` #624, 326M/mo
- `web-streams-polyfill` #630, 325M/mo
- `is-plain-object` #634, 323M/mo
- `@emnapi/core` #635, 322M/mo (low confidence: wasm/napi runtime glue)
- `stop-iteration-iterator` #640, 320M/mo
- `typed-array-byte-offset` #646, 317M/mo
- `own-keys` #649, 316M/mo
- `set-proto` #651, 315M/mo
- `array-includes` #655, 311M/mo
- `string.prototype.trim` #658, 309M/mo
- `safe-push-apply` #660, 309M/mo
- `async-function` #668, 307M/mo
- `es-shim-unscopables` #669, 306M/mo
- `@emnapi/wasi-threads` #673, 306M/mo (low confidence: WASI threads for emnapi)
- `@napi-rs/wasm-runtime` #674, 306M/mo (low confidence: wasm runtime for napi-rs)
- `object.values` #675, 306M/mo
- `generator-function` #678, 304M/mo
- `which-collection` #682, 304M/mo
- `is-date-object` #683, 303M/mo
- `detect-node-es` #687, 301M/mo
- `array.prototype.flat` #689, 300M/mo
- `destroy` #695, 299M/mo
- `is-finalizationregistry` #697, 298M/mo
- `lodash.isplainobject` #699, 296M/mo
- `regenerator-runtime` #705, 294M/mo
- `get-nonce` #736, 282M/mo (low confidence: tiny webpack nonce getter)
- `abort-controller` #766, 273M/mo
- `string.prototype.matchall` #769, 272M/mo
- `boolbase` #792, 266M/mo
- `type-detect` #793, 266M/mo
- `array.prototype.flatmap` #795, 266M/mo
- `node-domexception` #810, 261M/mo
- `event-target-shim` #812, 261M/mo
- `formdata-polyfill` #835, 254M/mo
- `fetch-blob` #842, 252M/mo
- `is-obj` #843, 252M/mo
- `any-promise` #845, 252M/mo
- `isobject` #851, 251M/mo
- `object.fromentries` #866, 246M/mo
- `setimmediate` #883, 242M/mo
- `css.escape` #887, 239M/mo
- `array.prototype.tosorted` #902, 235M/mo
- `lodash.isboolean` #909, 233M/mo
- `object.entries` #928, 230M/mo
- `array.prototype.findlastindex` #962, 225M/mo
- `@tybys/wasm-util` #969, 224M/mo
- `lodash.isstring` #970, 224M/mo
- `string.prototype.repeat` #978, 223M/mo
- `lodash.once` #985, 222M/mo (low confidence: once wrapper)
- `is-decimal` #991, 221M/mo
- `is-buffer` #992, 221M/mo
- `es-iterator-helpers` #996, 220M/mo

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `postcss` #44, 1.2B/mo
- `typescript` #47, 1.2B/mo
- `esbuild` #51, 1.2B/mo
- `@babel/core` #133, 780M/mo
- `vite` #134, 780M/mo
- `pnpm` #136, 772M/mo (low confidence: package manager)
- `update-browserslist-db` #150, 739M/mo
- `eslint` #183, 680M/mo
- `jiti` #214, 638M/mo
- `@typescript-eslint/parser` #271, 581M/mo
- `@eslint/js` #277, 574M/mo
- `@rolldown/pluginutils` #283, 569M/mo
- `@typescript-eslint/eslint-plugin` #290, 562M/mo
- `@eslint/eslintrc` #300, 550M/mo
- `@vitest/spy` #301, 547M/mo
- `loose-envify` #313, 531M/mo
- `@eslint/core` #315, 531M/mo
- `rollup` #317, 530M/mo
- `tailwindcss` #335, 507M/mo
- `@jest/schemas` #341, 499M/mo (low confidence: jest config JSON schemas)
- `prettier` #343, 497M/mo
- `@vitest/utils` #345, 496M/mo
- `@eslint/plugin-kit` #346, 496M/mo
- `@eslint/config-array` #355, 488M/mo
- `jest-util` #367, 479M/mo
- `@eslint/config-helpers` #369, 478M/mo
- `@vitest/expect` #377, 470M/mo
- `chai` #393, 449M/mo
- `playwright-core` #398, 444M/mo
- `@typescript-eslint/project-service` #401, 442M/mo
- `vitest` #402, 442M/mo
- `assertion-error` #403, 442M/mo (low confidence: Test framework error class)
- `rolldown` #436, 418M/mo
- `@vitest/mocker` #456, 407M/mo
- `playwright` #459, 406M/mo (low confidence: browser automation/testing framework)
- `@vitest/snapshot` #472, 395M/mo
- `@vitejs/plugin-react` #475, 392M/mo
- `@vitest/runner` #482, 389M/mo
- `tinybench` #484, 387M/mo (low confidence: benchmarking library, no peers)
- `tsx` #490, 383M/mo
- `expect-type` #501, 378M/mo (low confidence: type-level test assertions, no runtime task)
- `typescript-eslint` #535, 365M/mo
- `eslint-plugin-react-hooks` #559, 354M/mo
- `@tailwindcss/node` #582, 341M/mo
- `@tailwindcss/oxide` #584, 341M/mo (low confidence: no description; tailwind native engine)
- `terser` #586, 338M/mo
- `@bcoe/v8-coverage` #620, 327M/mo (low confidence: V8 coverage helper, test tooling)
- `istanbul-reports` #626, 326M/mo
- `istanbul-lib-report` #643, 318M/mo
- `@babel/plugin-syntax-jsx` #652, 313M/mo
- `@babel/helper-create-class-features-plugin` #661, 308M/mo
- `@testing-library/dom` #665, 307M/mo
- `jest-matcher-utils` #679, 304M/mo
- `@babel/helper-annotate-as-pure` #680, 304M/mo
- `@babel/helper-member-expression-to-functions` #685, 302M/mo
- `axe-core` #702, 295M/mo (low confidence: a11y testing engine)
- `jest-mock` #721, 288M/mo
- `@sinonjs/fake-timers` #731, 285M/mo (low confidence: fake timers for tests)
- `@babel/plugin-transform-modules-commonjs` #739, 281M/mo
- `@babel/plugin-transform-react-jsx-source` #745, 280M/mo
- `@babel/plugin-transform-react-jsx-self` #748, 280M/mo
- `@babel/plugin-syntax-typescript` #753, 279M/mo
- `@playwright/test` #761, 275M/mo
- `@rollup/pluginutils` #770, 272M/mo
- `test-exclude` #772, 271M/mo (low confidence: include/exclude path test for coverage tooling)
- `expect` #778, 270M/mo
- `@testing-library/jest-dom` #785, 268M/mo
- `autoprefixer` #789, 266M/mo
- `jest-haste-map` #803, 265M/mo (low confidence: file map for jest)
- `unplugin` #816, 260M/mo
- `eslint-plugin-import` #817, 260M/mo
- `eslint-config-prettier` #827, 257M/mo
- `eslint-plugin-react` #832, 255M/mo
- `@jest/transform` #854, 249M/mo
- `babel-plugin-polyfill-corejs3` #860, 248M/mo
- `@babel/plugin-syntax-import-attributes` #861, 248M/mo
- `@jest/environment` #868, 245M/mo (low confidence: jest internals)
- `@jest/fake-timers` #869, 245M/mo
- `istanbul-lib-source-maps` #871, 245M/mo (low confidence: coverage tooling)
- `@testing-library/react` #873, 244M/mo
- `webpack` #893, 238M/mo
- `babel-plugin-istanbul` #907, 234M/mo
- `babel-jest` #923, 231M/mo
- `@jest/console` #927, 230M/mo (low confidence: jest internals)
- `babel-preset-jest` #947, 228M/mo
- `postcss-load-config` #964, 225M/mo (low confidence: loads postcss config files)
- `napi-postinstall` #968, 224M/mo (low confidence: postinstall helper for native bindings)
- `babel-plugin-jest-hoist` #971, 223M/mo
- `jest-environment-node` #980, 223M/mo

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `webidl-conversions` #87, 937M/mo
- `scheduler` #135, 777M/mo (low confidence: react scheduler)
- `y18n` #141, 761M/mo (low confidence: yargs i18n helper)
- `side-channel` #166, 717M/mo
- `side-channel-list` #206, 644M/mo
- `side-channel-weakmap` #220, 630M/mo
- `side-channel-map` #249, 602M/mo
- `ajv-formats` #281, 570M/mo (low confidence: Ajv plugin; no standalone task)
- `@nodelib/fs.stat` #312, 533M/mo
- `@nodelib/fs.scandir` #326, 518M/mo
- `domutils` #371, 478M/mo
- `dom-serializer` #381, 466M/mo
- `@humanfs/core` #391, 454M/mo (low confidence: Core of humanfs)
- `domhandler` #414, 432M/mo
- `@emnapi/runtime` #443, 415M/mo (low confidence: Runtime for emnapi native addon support)
- `domelementtype` #453, 408M/mo
- `ajv-keywords` #508, 373M/mo (low confidence: ajv plugin keywords, not standalone)
- `xml-name-validator` #530, 366M/mo (low confidence: jsdom XML name validator)
- `tldts-core` #534, 365M/mo
- `jest-regex-util` #560, 354M/mo (low confidence: no description; jest sub-package)
- `jest-message-util` #562, 354M/mo (low confidence: no description; jest sub-package)
- `@protobufjs/utf8` #692, 300M/mo
- `micromark-util-symbol` #717, 291M/mo
- `micromark-util-character` #722, 288M/mo
- `pg-protocol` #755, 278M/mo
- `unist-util-is` #767, 273M/mo (low confidence: unist tree helper)
- `unist-util-visit` #768, 273M/mo (low confidence: unist tree traversal helper)
- `pg-types` #773, 271M/mo
- `@protobufjs/path` #798, 265M/mo
- `@protobufjs/float` #799, 265M/mo
- `webpack-sources` #807, 263M/mo
- `vfile-message` #821, 259M/mo
- `@babel/helper-replace-supers` #822, 259M/mo
- `@protobufjs/aspromise` #824, 258M/mo
- `@babel/helper-optimise-call-expression` #829, 256M/mo
- `@protobufjs/codegen` #836, 254M/mo
- `vfile` #852, 250M/mo
- `pg-connection-string` #875, 243M/mo (low confidence: pg sub-helper; connection string parser)
- `micromark-factory-space` #876, 243M/mo
- `mdast-util-to-string` #879, 243M/mo
- `micromark-util-sanitize-uri` #886, 239M/mo
- `victory-vendor` #906, 234M/mo
- `micromark-util-classify-character` #908, 234M/mo
- `micromark-util-combine-extensions` #913, 233M/mo
- `@sinonjs/commons` #929, 229M/mo (low confidence: sinon shared helpers)
- `zwitch` #933, 229M/mo (low confidence: tiny unified/micromark helper)
- `@jest/test-result` #938, 229M/mo
- `@jest/expect-utils` #944, 228M/mo
- `micromark-core-commonmark` #949, 227M/mo
- `micromark-factory-whitespace` #954, 226M/mo
- `micromark-factory-label` #956, 226M/mo
- `micromark-util-html-tag-name` #957, 226M/mo
- `micromark-util-chunked` #961, 225M/mo
- `@protobufjs/fetch` #976, 223M/mo
- `micromark-util-resolve-all` #979, 223M/mo
- `micromark-factory-destination` #987, 222M/mo
- `@pkgr/core` #994, 221M/mo (low confidence: shared core for @pkgr packages)

## Type definitions

Packages that ship only TypeScript types and have no runtime code.

- `@types/node` #15, 1.9B/mo
- `type-fest` #21, 1.6B/mo
- `undici-types` #36, 1.4B/mo
- `@types/estree` #95, 900M/mo
- `@typescript-eslint/types` #153, 738M/mo (low confidence: types plus runtime enums)
- `csstype` #164, 719M/mo
- `@oxc-project/types` #228, 620M/mo
- `@types/react-dom` #254, 594M/mo
- `@jest/types` #255, 594M/mo
- `@types/json-schema` #260, 588M/mo
- `@types/react` #269, 582M/mo
- `@types/babel__traverse` #405, 441M/mo
- `@types/babel__generator` #415, 432M/mo
- `@types/unist` #433, 421M/mo
- `@standard-schema/spec` #437, 418M/mo (low confidence: Spec mostly types)
- `@types/babel__template` #477, 391M/mo
- `@types/yargs` #480, 390M/mo
- `@types/chai` #481, 389M/mo
- `@types/babel__core` #483, 388M/mo
- `@types/deep-eql` #575, 344M/mo
- `@types/ms` #621, 327M/mo
- `@humanfs/types` #627, 326M/mo
- `@types/d3-color` #637, 321M/mo
- `@types/d3-interpolate` #641, 320M/mo
- `@octokit/types` #714, 292M/mo
- `@types/d3-shape` #715, 292M/mo
- `@types/d3-ease` #727, 286M/mo
- `@types/express-serve-static-core` #756, 277M/mo
- `@octokit/openapi-types` #760, 275M/mo
- `@types/connect` #762, 275M/mo
- `@types/send` #771, 272M/mo
- `@types/d3-timer` #776, 271M/mo
- `@types/d3-array` #783, 268M/mo
- `@types/ws` #784, 268M/mo
- `@types/d3-scale` #786, 267M/mo
- `@inquirer/type` #791, 266M/mo
- `@types/d3-path` #801, 265M/mo
- `hermes-estree` #805, 264M/mo (low confidence: Flow types, may have runtime)
- `@types/serve-static` #823, 259M/mo
- `micromark-util-types` #825, 258M/mo
- `@types/aria-query` #833, 255M/mo
- `@types/express` #837, 254M/mo
- `@types/d3-time` #839, 253M/mo
- `@types/istanbul-reports` #840, 253M/mo
- `@types/json5` #872, 245M/mo
- `@types/istanbul-lib-coverage` #874, 244M/mo
- `@types/body-parser` #910, 233M/mo
- `@types/yargs-parser` #915, 232M/mo
- `@types/qs` #924, 230M/mo
- `@types/range-parser` #937, 229M/mo
- `json-schema-typed` #955, 226M/mo
- `@types/hast` #972, 223M/mo
- `@types/debug` #981, 222M/mo
- `@types/http-errors` #999, 220M/mo

## UI components and hooks

Browser UI component libraries, icon sets, positioning engines and React hooks, whose work is rendering and interaction rather than one standard computational task.

- `@radix-ui/react-slot` #145, 760M/mo (low confidence: no description)
- `@radix-ui/react-primitive` #172, 707M/mo (low confidence: no description)
- `@radix-ui/react-context` #356, 486M/mo (low confidence: React context helper)
- `@radix-ui/react-compose-refs` #423, 427M/mo
- `lucide-react` #434, 420M/mo
- `@floating-ui/utils` #439, 417M/mo
- `@radix-ui/react-use-layout-effect` #441, 415M/mo
- `@radix-ui/primitive` #442, 415M/mo
- `@floating-ui/core` #461, 406M/mo
- `@radix-ui/react-use-controllable-state` #470, 396M/mo
- `@floating-ui/dom` #479, 390M/mo
- `@radix-ui/react-use-callback-ref` #500, 378M/mo
- `@radix-ui/react-id` #515, 371M/mo
- `@floating-ui/react-dom` #532, 366M/mo
- `@radix-ui/react-presence` #537, 364M/mo
- `@radix-ui/react-dismissable-layer` #544, 362M/mo
- `@radix-ui/react-use-effect-event` #573, 346M/mo
- `@radix-ui/react-focus-scope` #616, 328M/mo
- `@radix-ui/react-focus-guards` #617, 328M/mo
- `react-remove-scroll` #632, 324M/mo
- `@radix-ui/react-direction` #645, 317M/mo
- `aria-hidden` #659, 309M/mo
- `@radix-ui/react-dialog` #662, 308M/mo
- `use-sidecar` #670, 306M/mo
- `use-callback-ref` #681, 304M/mo
- `@radix-ui/react-use-size` #684, 303M/mo
- `@radix-ui/react-portal` #693, 300M/mo
- `@radix-ui/react-popper` #694, 300M/mo
- `@radix-ui/react-arrow` #704, 295M/mo
- `react-remove-scroll-bar` #711, 292M/mo
- `react-style-singleton` #720, 289M/mo
- `@radix-ui/react-roving-focus` #726, 286M/mo
- `@radix-ui/react-collection` #738, 282M/mo
- `@radix-ui/react-visually-hidden` #744, 280M/mo
- `@radix-ui/react-use-rect` #746, 280M/mo
- `@tanstack/react-query` #796, 265M/mo (low confidence: React data-fetching hooks; unclear fit)
- `@radix-ui/react-use-previous` #809, 262M/mo
- `@radix-ui/rect` #828, 257M/mo
- `@radix-ui/react-tabs` #831, 255M/mo
- `@radix-ui/react-dropdown-menu` #880, 242M/mo
- `@radix-ui/react-popover` #882, 242M/mo
- `@radix-ui/react-menu` #890, 239M/mo
- `@radix-ui/react-separator` #895, 238M/mo
- `react-hook-form` #901, 236M/mo
- `recharts` #918, 232M/mo
- `dom-helpers` #922, 231M/mo
- `react-transition-group` #935, 229M/mo
- `@radix-ui/react-label` #941, 228M/mo
- `@radix-ui/react-collapsible` #959, 226M/mo
- `@radix-ui/react-tooltip` #973, 223M/mo
- `@radix-ui/react-toggle` #997, 220M/mo

## Tooling internals (AST and code utilities)

Building blocks used inside compilers and linters, such as AST node helpers, traversal, scope analysis, tokenizing and code frames; standalone parsers are out of scope.

- `eslint-visitor-keys` #18, 1.7B/mo
- `json-schema-traverse` #34, 1.4B/mo (low confidence: schema traversal helper; excluded from schema-validation, nearest fit is internals)
- `@babel/code-frame` #63, 1.1B/mo
- `js-tokens` #66, 1.1B/mo
- `@babel/types` #75, 1.0B/mo
- `@babel/helper-validator-identifier` #78, 983M/mo
- `estraverse` #83, 964M/mo
- `eslint-scope` #98, 891M/mo
- `@babel/generator` #107, 865M/mo
- `@babel/helper-string-parser` #108, 855M/mo (low confidence: babel internal helper)
- `@babel/traverse` #110, 847M/mo
- `estree-walker` #142, 761M/mo
- `@babel/helpers` #156, 729M/mo
- `@babel/template` #157, 722M/mo
- `@babel/helper-module-transforms` #170, 710M/mo
- `@typescript-eslint/visitor-keys` #171, 708M/mo
- `esutils` #179, 691M/mo
- `@typescript-eslint/scope-manager` #180, 684M/mo
- `@babel/helper-plugin-utils` #184, 680M/mo
- `es-module-lexer` #207, 644M/mo
- `@typescript-eslint/utils` #211, 639M/mo
- `@babel/helper-module-imports` #216, 633M/mo
- `@babel/helper-compilation-targets` #225, 623M/mo
- `@babel/helper-validator-option` #227, 621M/mo
- `esrecurse` #250, 602M/mo
- `esquery` #263, 585M/mo
- `@eslint-community/regexpp` #270, 581M/mo
- `@eslint-community/eslint-utils` #294, 557M/mo
- `@typescript-eslint/type-utils` #303, 546M/mo
- `@typescript-eslint/tsconfig-utils` #306, 541M/mo
- `doctrine` #310, 535M/mo (low confidence: JSDoc parser)
- `ts-api-utils` #337, 505M/mo
- `@eslint/object-schema` #379, 467M/mo (low confidence: ESLint config object merge/validate internals)
- `cjs-module-lexer` #395, 448M/mo (low confidence: Lexer for CJS exports)
- `istanbul-lib-instrument` #566, 352M/mo
- `istanbul-lib-coverage` #577, 343M/mo (low confidence: coverage data model)
- `acorn-walk` #610, 330M/mo
- `@babel/helper-skip-transparent-expression-wrappers` #712, 292M/mo
- `ast-types` #752, 279M/mo
- `unist-util-stringify-position` #781, 269M/mo
- `unist-util-visit-parents` #797, 265M/mo
- `jsx-ast-utils` #826, 258M/mo
- `escodegen` #896, 237M/mo (low confidence: code generator from AST)

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `@opentelemetry/core` #237, 611M/mo
- `@opentelemetry/api-logs` #285, 567M/mo
- `@smithy/types` #314, 531M/mo
- `@opentelemetry/resources` #339, 504M/mo
- `@opentelemetry/semantic-conventions` #384, 460M/mo
- `@smithy/util-utf8` #416, 432M/mo
- `@aws-sdk/types` #420, 428M/mo
- `@opentelemetry/instrumentation` #429, 424M/mo
- `@aws-sdk/token-providers` #474, 393M/mo
- `@aws-sdk/credential-provider-web-identity` #504, 375M/mo
- `gcp-metadata` #510, 373M/mo
- `@smithy/node-http-handler` #512, 372M/mo
- `@aws-sdk/credential-provider-process` #522, 370M/mo
- `@smithy/util-buffer-from` #541, 363M/mo
- `@opentelemetry/api` #549, 359M/mo
- `@aws-sdk/credential-provider-sso` #553, 358M/mo
- `@smithy/fetch-http-handler` #554, 355M/mo
- `@opentelemetry/sdk-trace-base` #557, 355M/mo
- `@smithy/core` #568, 350M/mo
- `@smithy/signature-v4` #570, 349M/mo
- `google-auth-library` #594, 336M/mo
- `@aws-sdk/core` #618, 328M/mo
- `@aws-sdk/credential-provider-node` #653, 312M/mo
- `@aws-sdk/credential-provider-http` #657, 311M/mo
- `@aws-sdk/credential-provider-ini` #663, 308M/mo
- `@smithy/credential-provider-imds` #671, 306M/mo
- `@aws-sdk/xml-builder` #706, 294M/mo
- `@aws-sdk/credential-provider-env` #719, 291M/mo
- `@aws-sdk/nested-clients` #734, 283M/mo
- `@grpc/proto-loader` #749, 280M/mo (low confidence: gRPC proto loader)
- `@sentry/core` #782, 269M/mo
- `@opentelemetry/sdk-metrics` #802, 265M/mo
- `@aws/lambda-invoke-store` #804, 265M/mo
- `@aws-sdk/signature-v4-multi-region` #818, 260M/mo
- `@modelcontextprotocol/sdk` #917, 232M/mo
- `@aws-sdk/credential-provider-login` #920, 231M/mo
- `@opentelemetry/sdk-logs` #931, 229M/mo
- `@grpc/grpc-js` #950, 227M/mo (low confidence: gRPC protocol client/server)
- `@opentelemetry/otlp-transformer` #986, 222M/mo

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `ansi-regex` #12, 2.1B/mo
- `color-name` #23, 1.5B/mo
- `emoji-regex` #29, 1.5B/mo
- `mime-db` #49, 1.2B/mo
- `globals` #56, 1.1B/mo
- `shebang-regex` #79, 982M/mo
- `caniuse-lite` #115, 834M/mo
- `electron-to-chromium` #118, 822M/mo
- `node-releases` #129, 792M/mo
- `baseline-browser-mapping` #176, 698M/mo (low confidence: data lookup library)
- `@babel/helper-globals` #187, 673M/mo
- `@babel/compat-data` #197, 652M/mo
- `statuses` #215, 637M/mo (low confidence: HTTP status code table)
- `aria-query` #233, 616M/mo
- `mdn-data` #327, 516M/mo
- `human-signals` #365, 480M/mo
- `log-symbols` #392, 449M/mo (low confidence: Exports constant colored symbols)
- `binary-extensions` #471, 396M/mo
- `possible-typed-array-names` #487, 386M/mo
- `xmlchars` #507, 374M/mo (low confidence: XML character class tables/regexes)
- `figures` #590, 337M/mo
- `cli-spinners` #605, 332M/mo
- `is-potential-custom-element-name` #609, 330M/mo
- `methods` #774, 271M/mo
- `@istanbuljs/schema` #841, 252M/mo
- `character-entities` #853, 250M/mo
- `character-entities-legacy` #857, 249M/mo
- `axobject-query` #862, 248M/mo (low confidence: accessibility lookup tables)
- `property-information` #892, 238M/mo (low confidence: tables of HTML property info)
- `@inquirer/figures` #916, 232M/mo (low confidence: constant figure symbols)
- `core-js-compat` #988, 222M/mo

## Platform-specific binaries

Packages that only carry a prebuilt native executable or addon for one OS and CPU architecture.

- `@esbuild/linux-x64` #90, 922M/mo
- `lightningcss-linux-x64-gnu` #245, 606M/mo
- `lightningcss-linux-x64-musl` #399, 443M/mo
- `@rollup/rollup-linux-x64-gnu` #427, 425M/mo
- `@img/sharp-linux-x64` #545, 361M/mo
- `@rollup/rollup-linux-x64-musl` #601, 334M/mo
- `@img/sharp-libvips-linux-x64` #639, 320M/mo
- `@tailwindcss/oxide-linux-x64-gnu` #654, 312M/mo
- `@rolldown/binding-linux-x64-gnu` #677, 305M/mo
- `@tailwindcss/oxide-linux-x64-musl` #794, 266M/mo
- `@rolldown/binding-linux-x64-musl` #888, 239M/mo
- `@img/sharp-linuxmusl-x64` #993, 221M/mo

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `react` #151, 738M/mo
- `react-dom` #165, 718M/mo
- `lodash` #174, 706M/mo
- `prelude-ls` #243, 608M/mo (low confidence: Functional utility library for LiveScript)
- `jsdom` #411, 437M/mo
- `rxjs` #413, 433M/mo
- `react-refresh` #540, 363M/mo (low confidence: React hot-reload runtime)
- `core-js` #700, 296M/mo
- `cssstyle` #757, 277M/mo (low confidence: CSSOM piece of jsdom stack)
- `@hono/node-server` #819, 259M/mo (low confidence: node adapter for Hono)
- `next` #865, 246M/mo
- `react-router` #951, 226M/mo (low confidence: React routing library)

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `commander` #9, 2.1B/mo
- `argparse` #55, 1.1B/mo
- `yargs-parser` #57, 1.1B/mo
- `yargs` #61, 1.1B/mo
- `minimist` #189, 670M/mo
- `optionator` #205, 644M/mo
- `jackspeak` #366, 479M/mo
- `arg` #424, 427M/mo
- `@pkgjs/parseargs` #587, 338M/mo
- `nopt` #642, 319M/mo

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `ansi-styles` #4, 2.9B/mo
- `chalk` #13, 2.0B/mo
- `picocolors` #76, 999M/mo
- `tinyrainbow` #364, 481M/mo
- `kleur` #417, 431M/mo
- `colorette` #629, 325M/mo
- `sisteransi` #698, 297M/mo (low confidence: emits cursor/erase ANSI codes, not colors)
- `@colors/colors` #811, 261M/mo
- `ansi-colors` #838, 254M/mo

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `ajv` #20, 1.6B/mo
- `zod` #64, 1.1B/mo
- `type-check` #226, 621M/mo (low confidence: Runtime type checking with a type-string syntax; closest to schema validation)
- `schema-utils` #361, 481M/mo (low confidence: webpack options validation wrapper around ajv)
- `@sinclair/typebox` #368, 479M/mo
- `prop-types` #387, 459M/mo (low confidence: React prop runtime type checks; dev-only validator)
- `jest-validate` #849, 251M/mo (low confidence: jest config validation)
- `json-schema` #905, 234M/mo (low confidence: old JSON schema validator)

## File existence lookup

Find the first existing file or directory among candidate paths or by walking up parent directories; glob expansion, executable PATH lookup and module resolution are out of scope.

- `which` #33, 1.4B/mo (low confidence: PATH lookup, excluded by file-lookup description)
- `locate-path` #39, 1.3B/mo
- `find-up` #40, 1.3B/mo
- `path-exists` #77, 993M/mo
- `escalade` #109, 854M/mo
- `path-type` #425, 426M/mo (low confidence: Path type check via stat; closest to path-exists)
- `pkg-dir` #509, 373M/mo
- `lilconfig` #581, 343M/mo

## Object merging

Copy or recursively merge properties of source objects into a target object; cloning a single value, immutable-update libraries and Object.assign ponyfills are out of scope.

- `lodash.merge` #321, 521M/mo
- `merge-descriptors` #350, 492M/mo
- `extend` #426, 426M/mo
- `deepmerge` #465, 400M/mo
- `xtend` #528, 367M/mo
- `extend-shallow` #690, 300M/mo
- `utils-merge` #763, 275M/mo
- `defaults` #998, 220M/mo

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `p-limit` #30, 1.4B/mo
- `p-locate` #37, 1.4B/mo (low confidence: first-match promise with concurrency)
- `fastq` #266, 583M/mo
- `asynckit` #347, 495M/mo
- `run-parallel` #383, 463M/mo (low confidence: Runs callbacks in parallel with no concurrency limit)
- `async` #462, 405M/mo
- `p-map` #607, 332M/mo
- `neo-async` #747, 280M/mo

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `js-yaml` #43, 1.3B/mo
- `json5` #73, 1.0B/mo
- `strip-json-comments` #94, 908M/mo
- `yaml` #113, 835M/mo
- `ini` #213, 639M/mo
- `jsonc-parser` #732, 285M/mo
- `confbox` #934, 229M/mo

## Module resolution

Resolve a module specifier to a file path using the Node.js require algorithm from a given base directory; bundler-specific resolvers and loaders are out of scope.

- `resolve-from` #71, 1.0B/mo
- `resolve` #80, 979M/mo
- `enhanced-resolve` #259, 589M/mo (low confidence: Webpack-oriented configurable resolver; bundler-specific resolvers are out of scope)
- `tsconfig-paths` #548, 359M/mo (low confidence: resolves modules via tsconfig paths; unsure it fits Node algorithm)
- `resolve-pkg-maps` #598, 334M/mo
- `eslint-import-resolver-node` #847, 251M/mo (low confidence: eslint resolver wrapper around node resolve)
- `unrs-resolver` #899, 237M/mo

## JavaScript parsing

Parse JavaScript source text into an ESTree-style AST; AST traversal, code generation and tokenizer-only packages are out of scope.

- `acorn` #68, 1.1B/mo
- `@babel/parser` #101, 877M/mo
- `espree` #167, 713M/mo
- `@typescript-eslint/typescript-estree` #173, 707M/mo (low confidence: TS parser to ESTree)
- `esprima` #380, 467M/mo
- `hermes-parser` #638, 321M/mo
- `oxc-parser` #926, 230M/mo

## Source map decoding

Decode source map VLQ mappings and trace generated positions back to original ones; generating maps while editing code and converting map container formats are out of scope.

- `source-map` #22, 1.6B/mo
- `@jridgewell/trace-mapping` #62, 1.1B/mo
- `@jridgewell/sourcemap-codec` #89, 926M/mo
- `source-map-js` #127, 798M/mo
- `@jridgewell/source-map` #787, 267M/mo
- `@cspotcode/source-map-support` #942, 228M/mo (low confidence: stack trace remapping via source maps)

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `node-fetch` #125, 806M/mo
- `undici` #138, 770M/mo
- `axios` #354, 489M/mo
- `follow-redirects` #422, 428M/mo
- `gaxios` #430, 422M/mo
- `eventsource` #815, 260M/mo (low confidence: SSE client, not plain request/response)

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `whatwg-url` #82, 967M/mo
- `@jridgewell/resolve-uri` #140, 762M/mo
- `uri-js` #192, 665M/mo
- `fast-uri` #287, 565M/mo
- `parseurl` #376, 475M/mo
- `tldts` #517, 371M/mo (low confidence: domain/public-suffix parsing from hostnames, not full URL parsing)

## Color parsing and conversion

Parse CSS color strings and convert between color spaces such as RGB, HSL and Lab; terminal styling, named-color tables and interpolation are out of scope.

- `color-convert` #27, 1.5B/mo
- `d3-color` #622, 326M/mo
- `@csstools/css-color-parser` #676, 305M/mo
- `@asamuzakjp/css-color` #724, 287M/mo
- `@csstools/color-helpers` #808, 263M/mo
- `color-string` #990, 221M/mo

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `parse5` #232, 616M/mo
- `saxes` #448, 413M/mo
- `htmlparser2` #451, 412M/mo
- `sax` #488, 385M/mo
- `fast-xml-parser` #591, 337M/mo

## HTML entity escaping

Escape and unescape HTML special characters and entities in strings; CSS, RegExp and JavaScript string escaping are out of scope.

- `entities` #42, 1.3B/mo
- `escape-html` #342, 498M/mo
- `html-escaper` #516, 371M/mo
- `micromark-util-encode` #858, 249M/mo
- `decode-named-character-reference` #963, 225M/mo

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `flatted` #190, 669M/mo
- `parse-json` #262, 587M/mo
- `json-buffer` #304, 543M/mo (low confidence: JSON with binary/base64 support; loose fit)
- `json-parse-even-better-errors` #382, 466M/mo
- `json-bigint` #975, 223M/mo

## Deep equality

Compare two JavaScript values for structural equality; assertion libraries, diff output and shallow comparison are out of scope.

- `fast-deep-equal` #96, 900M/mo
- `deep-is` #240, 610M/mo
- `dequal` #457, 407M/mo
- `deep-eql` #904, 234M/mo
- `fast-equals` #974, 223M/mo

## Glob matching

Test whether path strings match a glob pattern, purely in memory; walking the filesystem, gitignore rule sets and brace-only expansion are out of scope.

- `minimatch` #3, 3.0B/mo
- `picomatch` #14, 1.9B/mo
- `micromatch` #182, 683M/mo
- `anymatch` #360, 481M/mo

## CSS stylesheet parsing

Parse a whole CSS stylesheet into an AST or object model; selector-only or value-only parsers, tokenizers and plugin-driven transformers are out of scope.

- `lightningcss` #238, 610M/mo (low confidence: Parser plus transformer/minifier; parsing is only one part)
- `css-tree` #358, 485M/mo
- `@csstools/css-parser-algorithms` #628, 326M/mo
- `@adobe/css-tools` #867, 246M/mo

## Value inspection and formatting

Render arbitrary JavaScript values as human-readable strings for logs, assertions and snapshots; JSON serialization and diffing are out of scope.

- `pretty-format` #88, 930M/mo
- `object-inspect` #175, 703M/mo
- `@vitest/pretty-format` #322, 521M/mo
- `loupe` #960, 225M/mo

## Filesystem globbing

Expand glob patterns into the list of matching paths by walking the filesystem; in-memory pattern matching and unfiltered directory crawling are out of scope.

- `glob` #28, 1.5B/mo
- `tinyglobby` #114, 835M/mo
- `fast-glob` #195, 653M/mo
- `globby` #489, 384M/mo

## Directory walking

Recursively enumerate every file and directory under a root; glob pattern expansion and file watching are out of scope.

- `readdirp` #106, 865M/mo
- `fdir` #124, 808M/mo
- `path-scurry` #137, 772M/mo
- `@nodelib/fs.walk` #330, 512M/mo

## Child process execution

Spawn a child process and collect its exit status and output; shell-string quoting, PATH lookup and signal tables are out of scope.

- `cross-spawn` #67, 1.1B/mo
- `execa` #169, 710M/mo
- `tinyexec` #248, 603M/mo
- `foreground-child` #388, 458M/mo

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `jose` #274, 579M/mo
- `jws` #552, 358M/mo
- `jwa` #672, 306M/mo (low confidence: JWA sign/verify algorithms, lower-level than JWT)
- `jsonwebtoken` #877, 243M/mo

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `decimal.js` #499, 378M/mo
- `bn.js` #751, 279M/mo
- `bignumber.js` #814, 260M/mo
- `fraction.js` #844, 252M/mo

## Terminal string width

Compute how many terminal columns a string or code point occupies, accounting for wide East Asian characters; wrapping, truncating and stripping styled text are out of scope.

- `string-width` #11, 2.1B/mo
- `eastasianwidth` #536, 365M/mo
- `get-east-asian-width` #578, 343M/mo
- `cli-truncate` #989, 222M/mo (low confidence: width-aware truncation)

## Indentation stripping

Remove common leading whitespace from multi-line strings; adding indentation, word wrapping and code formatting are out of scope.

- `strip-indent` #485, 387M/mo
- `redent` #710, 293M/mo
- `dedent` #725, 287M/mo
- `min-indent` #790, 266M/mo (low confidence: computes min indent only, not stripping)

## Stream implementations

Userland readable/writable/passthrough stream classes that data is piped through; helpers that only consume or collect an existing stream are out of scope.

- `readable-stream` #25, 1.5B/mo
- `minipass` #72, 1.0B/mo
- `bl` #583, 341M/mo

## Deterministic JSON stringification

Serialize JavaScript values to JSON with a stable, sorted key order; pretty-printers for debugging and content hashing are out of scope.

- `fast-json-stable-stringify` #201, 647M/mo
- `json-stable-stringify-without-jsonify` #286, 566M/mo
- `safe-stable-stringify` #846, 251M/mo

## Event emitters

In-process publish/subscribe objects with on/off/emit semantics; DOM EventTarget implementations, plugin hook systems and reactive streams are out of scope.

- `eventemitter3` #194, 657M/mo
- `events` #564, 354M/mo
- `@protobufjs/eventemitter` #729, 285M/mo

## Stream merging

Combine several readable streams into one output stream, in sequence or interleaved; stream class implementations and pipe/cleanup helpers are out of scope.

- `merge2` #338, 504M/mo
- `combined-stream` #344, 497M/mo
- `merge-stream` #445, 414M/mo

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `express` #291, 561M/mo
- `router` #716, 292M/mo
- `hono` #742, 281M/mo

## Deflate compression

Compress and decompress byte buffers with deflate, zlib or gzip framing; archive formats and string-oriented LZ codecs are out of scope.

- `pako` #348, 495M/mo
- `fflate` #579, 343M/mo
- `minizlib` #612, 330M/mo

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `tar-stream` #419, 428M/mo
- `tar` #542, 363M/mo
- `tar-fs` #870, 245M/mo

## Namespaced debug logging

Create named loggers that are switched on or off by an environment variable or pattern and format messages to a stream; structured log pipelines, console wrappers and telemetry SDKs are out of scope.

- `debug` #2, 3.0B/mo
- `google-logging-utils` #589, 338M/mo
- `obug` #666, 307M/mo

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `uuid` #50, 1.2B/mo
- `nanoid` #69, 1.0B/mo
