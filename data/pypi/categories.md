# Package categories: PyPI

1000 of 1000 packages categorized into 138 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Service SDKs and telemetry (`service-sdks`) | 156 | no |  |
| Other (no peers yet) (`other`) | 100 | no |  |
| Build, lint and test tooling (`build-tooling`) | 75 | no |  |
| Framework and tool extensions (`framework-extensions`) | 58 | no |  |
| Frameworks and broad libraries (`frameworks`) | 36 | no |  |
| Platform-specific binaries (`platform-binaries`) | 32 | no |  |
| Library internals (`library-internals`) | 26 | no |  |
| System and foreign bindings (`system-bindings`) | 25 | no |  |
| Type definitions (`type-definitions`) | 22 | no |  |
| Language-level abstractions (`language-ergonomics`) | 18 | no |  |
| Applications and daemons (`applications`) | 18 | no |  |
| Tooling internals (AST and code utilities) (`tooling-internals`) | 13 | no |  |
| Runtime helpers and shims (`runtime-shims`) | 13 | no |  |
| HTTP clients (`http-client`) | 12 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| Date and time (`date-time`) | 12 | yes | Parse 100,000 ISO 8601 timestamps, add calendar durations and format each back to a string. |
| Environment detection (`environment-detection`) | 12 | no |  |
| Schema validation (`schema-validation`) | 11 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| Binary serialization (`binary-serialization`) | 11 | yes | Encode and decode 100,000 records with nested integers, strings and arrays. |
| CLI argument parsing (`cli-argument-parsing`) | 9 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| Static data and patterns (`static-data`) | 9 | no |  |
| HTML and XML parsing (`markup-parsing`) | 8 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| Typed object mapping (`typed-object-mapping`) | 8 | yes | Build 100,000 nested record objects from plain dictionaries and convert them back to dictionaries. |
| Dataframes (`dataframes`) | 8 | yes | Load a 1,000,000-row table, filter it, group by a key column and compute sum and mean aggregates. |
| Async concurrency control (`async-concurrency`) | 7 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| JSON path queries (`json-path-query`) | 7 | yes | Compile a fixed set of path expressions and evaluate each against a 1 MB nested document. |
| WebSocket messaging (`websocket-messaging`) | 7 | yes | Echo 100,000 text and binary messages over a loopback connection, or through the codec in memory. |
| Generated API and schema types (`generated-api-types`) | 7 | no |  |
| JSON parsing (`json-parsing`) | 6 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| Chart rendering (`chart-rendering`) | 6 | yes | Render a line chart with 10 series of 10,000 points each to SVG or PNG. |
| PDF reading (`pdf-text-extraction`) | 6 | yes | Extract the text of every page from a fixed set of PDF documents totalling 1,000 pages. |
| Retry policies (`retry-policies`) | 6 | yes | Wrap a function that fails a fixed number of times before succeeding and call it 100,000 times with zero delay. |
| PostgreSQL clients (`postgres-client`) | 6 | yes | Against a local PostgreSQL server, insert 100,000 rows with a prepared statement and read them back. |
| Terminal string styling (`terminal-styling`) | 5 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Config format parsing (`config-format-parsing`) | 5 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| Event emitters (`event-emitter`) | 5 | yes | Register 10 listeners on each of several event names and emit one million events with two arguments. |
| URL and URI parsing (`url-parsing`) | 5 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| JWT signing and verification (`jwt-signing`) | 5 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Non-deflate compression (`block-compression`) | 5 | yes | Compress and decompress a fixed 32 MB mixed text and binary corpus at the default level. |
| Markdown rendering (`markdown-parsing`) | 5 | yes | Render a fixed corpus of Markdown documents totalling several megabytes to HTML. |
| Immutable collections (`immutable-collections`) | 5 | yes | Build a 100,000-entry immutable map by successive inserts, then run a fixed mix of lookups and updates on it. |
| Image processing (`image-processing`) | 5 | yes | Decode a fixed set of JPEG and PNG photos, resize each to a thumbnail and re-encode it. |
| Structured logging (`structured-logging`) | 5 | yes | Log 1,000,000 records with five key-value fields each as JSON lines to a null sink. |
| File type detection (`file-type-detection`) | 5 | yes | Identify the type of each of 10,000 buffers holding the first bytes of files in 50 common formats. |
| Unique ID generation (`id-generation`) | 4 | yes | Generate one million random unique IDs using the package's default secure generator. |
| HTTP server routing (`http-server-routing`) | 4 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| UI components and hooks (`ui-components`) | 4 | no |  |
| Hash maps (`hash-maps`) | 4 | yes | Insert 1,000,000 integer and string keys, look each up, iterate, then remove half. |
| Parser combinators and generators (`parser-combinators`) | 4 | yes | Implement the same JSON grammar with each library and parse a 10 MB JSON document. |
| TOML parsing (`toml-parsing`) | 4 | yes | Parse a fixed corpus of TOML documents, including a 5,000-line lockfile. |
| Object graph pickling (`object-pickling`) | 4 | yes | Serialize and restore a graph of 100,000 class instances plus a set of closures. |
| PDF generation (`pdf-generation`) | 4 | yes | Generate a 100-page PDF of paragraphs and a table from fixed input data. |
| File locking (`file-locking`) | 4 | yes | Acquire and release an uncontended lock file 100,000 times, then repeat with several contending processes. |
| Character encoding detection (`charset-detection`) | 4 | yes | Detect the encoding of a fixed corpus of 1,000 text files in assorted legacy and Unicode encodings. |
| Password hashing (`password-hashing`) | 4 | yes | Hash and verify 100 passwords at fixed, equivalent cost parameters. |
| HTTP message parsing (`http-message-parsing`) | 4 | yes | Parse a fixed buffer of 100,000 concatenated HTTP/1.1 requests with typical browser headers, collecting method, path and headers. |
| Semantic version comparison (`semver-comparison`) | 4 | yes | Parse a fixed list of 10,000 version strings, sort them, and test each against a fixed set of range constraints. |
| Embedded key-value stores (`embedded-key-value-stores`) | 4 | yes | Write 1,000,000 key-value pairs in batches to a fresh on-disk store, read each back at random, then scan a key range in order. |
| Glob matching (`glob-matching`) | 3 | yes | Compile a fixed set of glob patterns and match each against a fixed list of 10,000 path strings. |
| Non-cryptographic hashing (`non-cryptographic-hashing`) | 3 | yes | Hash 1,000,000 short keys and one 64 MB buffer to a 64-bit value. |
| ASN.1 DER decoding (`asn1-der-decoding`) | 3 | yes | Decode a fixed set of 1,000 DER-encoded X.509 certificates into their fields. |
| HTML sanitizing (`html-sanitizing`) | 3 | yes | Sanitize a fixed set of 1,000 HTML fragments containing scripts, event handlers and unknown tags with a default allow-list. |
| CSS selector matching (`css-selector-matching`) | 3 | yes | Run a fixed list of 100 selectors against a parsed 1 MB HTML document and count the matches. |
| Text table rendering (`text-table-rendering`) | 3 | yes | Render a table of 10,000 rows and 8 mixed-type columns to a string. |
| Subword tokenization (`subword-tokenization`) | 3 | yes | Encode and decode a 10 MB text corpus with a fixed pretrained vocabulary. |
| MySQL clients (`mysql-client`) | 3 | yes | Against a local MySQL server, insert 100,000 rows with a prepared statement and read them back. |
| Background job queues (`background-job-queues`) | 3 | yes | Against a local backend, enqueue 10,000 no-op jobs with small arguments and run a worker until the queue is drained. |
| Redis clients (`redis-client`) | 3 | yes | Against a local Redis server, run 100,000 SET and GET commands, both one at a time and in pipelines of 100. |
| Cron expression scheduling (`cron-scheduling`) | 3 | yes | Parse a fixed set of cron expressions and compute the next 1,000 occurrence times of each from a fixed start date. |
| Edit distance and string similarity (`edit-distance`) | 3 | yes | Compute the Levenshtein distance for 100,000 fixed pairs of strings of 5 to 200 characters. |
| SQL parsing (`sql-parsing`) | 3 | yes | Parse 10,000 fixed SELECT, INSERT, UPDATE and CREATE TABLE statements of 100 to 2,000 characters. |
| Linear algebra and arrays (`linear-algebra`) | 3 | yes | Multiply two 1,000 by 1,000 matrices of 64-bit floats and multiply 10,000,000 pairs of 4 by 4 matrices. |
| Object-relational mapping (`object-relational-mapping`) | 3 | yes | Against an in-memory SQLite database, insert 100,000 model objects, load them back with a filtered query and update one field on each. |
| Git repository access (`git-repository-access`) | 3 | yes | In a repository of 10,000 commits and 5,000 files, walk the full history and read every blob of the head tree. |
| Deep equality (`deep-equality`) | 2 | yes | Compare a fixed set of equal and unequal pairs of nested objects, arrays, Maps and Dates. |
| Child process execution (`process-execution`) | 2 | yes | Spawn the same trivial command 200 times and collect its stdout and exit code. |
| Tar archiving (`tar-archiving`) | 2 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 2 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| LRU caches (`lru-cache`) | 2 | yes | Replay a fixed Zipf-distributed trace of 1,000,000 get/set operations against a cache capped at 10,000 entries. |
| Bit sets (`bit-sets`) | 2 | yes | Set and test 1,000,000 pseudo-random bit positions, then union, intersect and count two sets. |
| Checksums (`checksums`) | 2 | yes | Checksum a 64 MB buffer in one call and again in 4 KB incremental updates. |
| Regular expression matching (`regex-matching`) | 2 | yes | Compile a fixed set of 20 patterns and find all matches of each in a 10 MB text corpus. |
| Digital signatures (`digital-signatures`) | 2 | yes | Generate a key pair, then sign and verify 10,000 short messages. |
| Identifier case conversion (`case-conversion`) | 2 | yes | Convert 1,000,000 mixed identifiers to snake, camel and kebab case. |
| Template rendering (`template-rendering`) | 2 | yes | Compile a template that loops over 1,000 records with a conditional and escaped interpolation, then render it 1,000 times. |
| HTTP application servers (`http-application-servers`) | 2 | yes | Serve a fixed 1 KB response from a trivial application callback to 100,000 keep-alive requests from a local load generator. |
| Dotenv loading (`dotenv-loading`) | 2 | yes | Parse the same .env text of 1,000 assignments with quotes, comments and variable references into a key-value map. |
| File system watching (`file-watching`) | 2 | yes | Watch a directory tree of 1,000 files, apply a fixed script of 10,000 creates, writes and removes, and collect every resulting event. |
| Human-readable size formatting (`human-size-formatting`) | 2 | yes | Format a fixed list of 1,000,000 byte counts as human-readable sizes and parse each resulting string back to a number. |
| Public suffix lookup (`public-suffix-lookup`) | 2 | yes | Split 100,000 host names covering 1,000 distinct suffixes into their registrable domain and public suffix. |
| URI template expansion (`uri-template-expansion`) | 2 | yes | Expand 1,000 templates covering all four RFC 6570 levels against 100 variable sets each. |
| Terminal progress bars and spinners (`terminal-progress-bars`) | 2 | yes | Advance a progress bar 1,000,000 times toward a fixed total while it renders to an in-memory, non-interactive stream. |
| Spreadsheet file reading (`spreadsheet-reading`) | 2 | yes | Open a 20 MB workbook of 5 sheets with 100,000 rows of 10 columns each and read every cell value. |
| ASCII transliteration and slugs (`ascii-transliteration`) | 2 | yes | Transliterate 100,000 titles of 80 characters in 20 scripts to ASCII. |
| Rate limiting (`rate-limiting`) | 2 | yes | Check 10,000,000 requests spread over 10,000 keys against a limit of 100 per second using an in-memory store. |
| SSH and SFTP clients (`ssh-client`) | 2 | yes | Against a local SSH server, run 1,000 short commands over one connection and transfer a 100 MB file there and back over SFTP. |
| Kafka clients (`kafka-client`) | 2 | yes | Against a local single-node broker, produce 1,000,000 records of 1 KB to one topic and consume them all back. |
| gRPC (`grpc-rpc`) | 2 | yes | Make 100,000 unary calls with a 1 KB request and response, and stream 1,000,000 messages, between a client and server on the loopback interface. |
| SOCKS proxy clients (`socks-proxy-client`) | 2 | yes | Open 10,000 connections through a local SOCKS5 proxy to a local echo server and send 1 KB over each. |
| Fake data generation (`fake-data-generation`) | 2 | yes | With a fixed seed, generate 1,000,000 records of name, email, street address and date. |
| File existence lookup (`file-lookup`) | 1 | yes | From a deep directory in a fixture tree, locate the nearest existing marker file among candidates in each ancestor directory. |
| CSS stylesheet parsing (`css-parsing`) | 1 | yes | Parse one large real-world stylesheet (for example a CSS framework build) into the package's AST. |
| HTML entity escaping (`html-escaping`) | 1 | yes | Escape the five HTML special characters in 100,000 short strings of mixed text and markup. |
| Object merging (`object-merging`) | 1 | yes | Merge a fixed sequence of nested plain option objects into one result object, 100,000 times. |
| Directory walking (`directory-walking`) | 1 | yes | Recursively list every file in a fixture tree of roughly 10,000 files across nested directories. |
| Deflate compression (`deflate-compression`) | 1 | yes | Gzip and then gunzip the same 10 MB mixed text and binary buffer. |
| Color parsing and conversion (`css-color-parsing`) | 1 | yes | Parse a fixed list of 100,000 hex, rgb() and hsl() color strings and convert each to an RGB triple. |
| Terminal string width (`terminal-string-width`) | 1 | yes | Compute the display width of 100,000 strings mixing ASCII, CJK and emoji characters. |
| Cryptographic hashing (`cryptographic-hashing`) | 1 | yes | Digest a 64 MB buffer and 100,000 64-byte messages with the package's primary algorithm. |
| Base64 encoding (`base64-encoding`) | 1 | yes | Encode and decode a 16 MB buffer and 100,000 32-byte values with the standard alphabet. |
| Text diffing (`text-diff`) | 1 | yes | Diff pairs of 10,000-line text files that differ by 1%, 10% and 50% of their lines. |
| Macro and derive support (`macro-support`) | 1 | no |  |
| User-agent parsing (`user-agent-parsing`) | 1 | yes | Parse a fixed list of 10,000 real-world User-Agent strings and read the browser name, version and platform of each. |
| Message translation (`message-translation`) | 1 | yes | Load a catalog of 5,000 messages in two locales and perform 100,000 lookups with interpolation and pluralization. |
| INI and properties parsing (`ini-parsing`) | 1 | yes | Parse the same 5,000-line INI document of sections and key=value pairs, then read every value back by section and key. |
| Sorted maps and prefix trees (`sorted-maps`) | 1 | yes | Insert 1,000,000 string keys, look each up, then run a fixed set of range and prefix scans in key order. |
| Metrics instrumentation (`metrics-instrumentation`) | 1 | yes | Register 100 labelled counters, gauges and histograms, apply 10,000,000 updates from several threads, then render one text snapshot of the registry. |
| MongoDB clients (`mongodb-client`) | 1 | yes | Against a local server, insert 10,000 documents into a collection and read them back with a query that returns ten fields each. |
| ZIP archiving (`zip-archiving`) | 1 | yes | Pack a fixed set of in-memory files into a deflate-compressed ZIP archive, then list and extract every entry from it. |
| QR code generation (`qr-code-generation`) | 1 | yes | Encode a fixed set of URLs and text payloads at a given error-correction level and produce the module matrix or SVG for each. |
| Dependency injection containers (`dependency-injection`) | 1 | yes | Register a fixed graph of a few hundred interdependent services with singleton and transient lifetimes, then resolve the root services repeatedly. |
| Iterator combinators (`iterator-combinators`) | 1 | yes | Push a million-element iterable through a fixed chain of map, filter, chunk and take steps and reduce the result to a single value. |
| IDNA and Punycode conversion (`idna-punycode`) | 1 | yes | Convert 100,000 Unicode domain names to ASCII and back to Unicode. |
| Path string manipulation (`path-manipulation`) | 1 | yes | Normalize 100,000 path strings with mixed separators and dot segments, and compute the relative path between 100,000 pairs. |
| Layered configuration loading (`layered-configuration`) | 1 | yes | Load a 1,000-key configuration from two files plus 100 environment overrides and read every key 100 times. |
| Syntax highlighting (`syntax-highlighting`) | 1 | yes | Highlight a 1 MB source file to HTML, 10 times over. |
| GraphQL execution (`graphql-execution`) | 1 | yes | Against a schema of 50 types, parse, validate and execute 10,000 queries that each resolve about 100 fields from in-memory data. |
| Spreadsheet file writing (`spreadsheet-writing`) | 1 | yes | Write a workbook of 5 sheets with 100,000 rows of 10 mixed numeric and string columns each. |
| HTML to Markdown conversion (`html-to-markdown`) | 1 | yes | Convert 1,000 HTML documents of 50 KB each, with headings, lists, links, tables and code blocks, to Markdown. |
| JSON Patch (`json-patch`) | 1 | yes | Apply 100,000 patches of 10 operations each to a 100 KB JSON document. |
| Noun pluralization (`noun-inflection`) | 1 | yes | Pluralize and then singularize a fixed list of 100,000 English nouns, 5 percent of them irregular. |
| Natural sort order (`natural-sorting`) | 1 | yes | Sort 1,000,000 strings that mix letters and digit runs into natural order. |
| One-time passwords (`one-time-passwords`) | 1 | yes | Generate 1,000,000 TOTP codes for fixed secrets and timestamps and verify each with a window of one step. |
| Single-format image codecs (`image-decoding`) | 1 | yes | Decode 100 images of 4,000 by 3,000 pixels in the member's format to RGBA pixel buffers. |
| Graph algorithms (`graph-algorithms`) | 1 | yes | Build a directed acyclic graph of 100,000 nodes and 500,000 edges, topologically sort it and find its strongly connected components. |
| DNS messages and resolution (`dns-message-codec`) | 1 | yes | Decode and re-encode 1,000,000 DNS response messages that carry 10 mixed A, AAAA, CNAME, MX and TXT records each. |
| SQLite clients (`sqlite-client`) | 1 | yes | In an in-memory database, insert 1,000,000 rows of 5 columns in one transaction and select them all back. |
| Expression evaluation (`expression-evaluation`) | 1 | yes | Compile 1,000 expressions of about 20 operators each and evaluate every one against 10,000 variable bindings. |
| XML building (`xml-building`) | 1 | yes | Build and serialize a document of 1,000,000 elements, each with 3 attributes and a text node. |

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `boto3` #1, 2.4B per month
- `botocore` #17, 835M per month
- `s3transfer` #30, 628M per month
- `aiobotocore` #32, 608M per month
- `ghapi` #48, 465M per month
- `opentelemetry-api` #58, 432M per month
- `google-auth` #77, 363M per month
- `s3fs` #97, 298M per month
- `openai` #101, 291M per month
- `google-api-core` #104, 283M per month
- `opentelemetry-sdk` #111, 251M per month
- `huggingface-hub` #120, 231M per month
- `mcp` #127, 219M per month
- `ydb` #131, 210M per month
- `opentelemetry-exporter-otlp-proto-common` #142, 195M per month
- `hf-xet` #146, 187M per month
- `opentelemetry-exporter-otlp-proto-http` #155, 175M per month
- `azure-core` #174, 155M per month
- `google-cloud-core` #175, 154M per month
- `msal` #185, 148M per month
- `google-cloud-storage` #186, 147M per month
- `anthropic` #187, 147M per month
- `opentelemetry-instrumentation` #189, 147M per month
- `google-cloud-bigquery` #197, 142M per month
- `google-genai` #210, 136M per month
- `google-resumable-media` #212, 135M per month
- `docker` #220, 129M per month
- `sentry-sdk` #223, 126M per month
- `google-api-python-client` #232, 123M per month
- `opentelemetry-util-http` #234, 123M per month
- `google-auth-httplib2` #235, 122M per month
- `azure-identity` #245, 115M per month
- `google-auth-oauthlib` #250, 111M per month
- `msal-extensions` #251, 110M per month
- `opentelemetry-exporter-otlp-proto-grpc` #255, 106M per month
- `snowflake-connector-python` #263, 99M per month
- `llama-parse` #265, 97M per month
- `azure-storage-blob` #273, 95M per month
- `litellm` #283, 92M per month
- `google-cloud-aiplatform` #291, 89M per month
- `awswrangler` #298, 84M per month
- `databricks-sdk` #306, 82M per month
- `opentelemetry-instrumentation-requests` #313, 77M per month
- `langsmith` #314, 76M per month
- `slack-sdk` #321, 74M per month
- `kubernetes` #325, 73M per month
- `opentelemetry-instrumentation-fastapi` #343, 66M per month
- `opentelemetry-instrumentation-asgi` #354, 64M per month
- `llama-cloud-services` #384, 57M per month
- `google-cloud-secret-manager` #390, 55M per month
- `opentelemetry-exporter-otlp` #394, 55M per month
- `modal` #397, 54M per month
- `langchain-protocol` #410, 52M per month (low confidence: protocol bindings for LangChain)
- `requests-aws4auth` #418, 50M per month
- `msrest` #426, 49M per month
- `datadog` #428, 49M per month
- `pygithub` #429, 48M per month
- `opentelemetry-instrumentation-httpx` #442, 46M per month
- `google-cloud-resource-manager` #468, 42M per month
- `langgraph-sdk` #469, 42M per month
- `google-cloud-pubsub` #480, 41M per month
- `azure-keyvault-secrets` #485, 40M per month
- `posthog` #495, 39M per month
- `opensearch-py` #505, 39M per month
- `databricks-sql-connector` #513, 38M per month
- `temporalio` #522, 37M per month
- `langchain-openai` #529, 37M per month
- `ddtrace` #531, 37M per month
- `stripe` #537, 36M per month
- `azure-common` #541, 36M per month
- `opentelemetry-instrumentation-threading` #551, 35M per month
- `elasticsearch` #564, 34M per month
- `google-cloud-appengine-logging` #572, 33M per month
- `google-cloud-logging` #586, 32M per month
- `gspread` #596, 31M per month
- `databricks-sqlalchemy` #602, 31M per month
- `langchain-google-vertexai` #612, 30M per month
- `google-cloud-firestore` #613, 30M per month
- `opentelemetry-instrumentation-dbapi` #619, 30M per month
- `claude-agent-sdk` #624, 29M per month
- `opentelemetry-instrumentation-sqlalchemy` #626, 29M per month
- `azure-storage-file-datalake` #639, 28M per month
- `opentelemetry-instrumentation-urllib3` #651, 27M per month
- `opentelemetry-instrumentation-django` #657, 27M per month
- `gcsfs` #661, 27M per month
- `opentelemetry-instrumentation-wsgi` #663, 27M per month
- `opentelemetry-instrumentation-psycopg2` #665, 27M per month
- `aioboto3` #678, 26M per month
- `opentelemetry-instrumentation-logging` #681, 26M per month
- `mlflow-skinny` #694, 25M per month
- `oauth2client` #696, 25M per month
- `opentelemetry-instrumentation-flask` #697, 24M per month
- `snowflake-sqlalchemy` #705, 24M per month
- `adal` #712, 24M per month
- `cloudpathlib` #713, 24M per month (low confidence: cloud path abstraction)
- `azure-monitor-opentelemetry-exporter` #725, 23M per month
- `langfuse` #731, 23M per month
- `realtime` #734, 23M per month (low confidence: Supabase realtime client)
- `postgrest` #735, 23M per month
- `storage3` #736, 23M per month
- `supabase` #738, 23M per month
- `google-cloud-bigquery-storage` #744, 22M per month
- `google-cloud-monitoring` #745, 22M per month
- `azure-mgmt-core` #746, 22M per month
- `logfire-api` #748, 22M per month (low confidence: logging shim)
- `fastspec` #754, 22M per month (low confidence: API spec client)
- `snowplow-tracker` #766, 21M per month
- `agent-client-protocol` #783, 20M per month (low confidence: protocol SDK)
- `supabase-auth` #787, 20M per month
- `supabase-functions` #788, 20M per month
- `azure-storage-queue` #795, 20M per month
- `hvac` #801, 20M per month
- `awscrt` #804, 20M per month
- `sendgrid` #809, 20M per month
- `simple-salesforce` #812, 19M per month
- `aws-requests-auth` #813, 19M per month
- `opentelemetry-instrumentation-redis` #817, 19M per month
- `sagemaker-studio` #827, 19M per month
- `twilio` #828, 19M per month
- `azure-datalake-store` #831, 19M per month
- `yfinance` #833, 19M per month
- `datadog-api-client` #834, 19M per month
- `id` #852, 18M per month (low confidence: OIDC identity generation tool)
- `pandas-gbq` #862, 17M per month
- `langchain-anthropic` #864, 17M per month
- `nexus-rpc` #865, 17M per month
- `jira` #869, 17M per month
- `opentelemetry-exporter-prometheus` #871, 17M per month
- `databricks-labs-blueprint` #885, 17M per month (low confidence: Databricks Labs helpers)
- `groq` #889, 17M per month
- `sagemaker` #900, 16M per month
- `pydata-google-auth` #902, 16M per month
- `mistralai` #909, 16M per month
- `azure-keyvault-keys` #913, 16M per month
- `boostedblob` #916, 16M per month (low confidence: Unified file ops over GCS/Azure/local)
- `azure-servicebus` #923, 16M per month
- `google-cloud-spanner` #926, 16M per month
- `watchtower` #936, 15M per month
- `google-cloud-speech` #939, 15M per month
- `youtube-transcript-api` #940, 15M per month (low confidence: Client for one vendor service (YouTube))
- `gremlinpython` #943, 15M per month (low confidence: Gremlin/TinkerPop graph DB client)
- `google-cloud-kms` #952, 15M per month
- `pyathena` #955, 15M per month
- `msrestazure` #956, 15M per month
- `mlflow-tracing` #958, 15M per month
- `firebase-admin` #960, 15M per month
- `trino` #961, 15M per month (low confidence: Client for Trino SQL engine; no matching DB-client category)
- `google-cloud-bigtable` #964, 14M per month
- `oss2` #965, 14M per month
- `google-cloud-tasks` #971, 14M per month
- `wandb` #974, 14M per month
- `blobfile` #978, 14M per month (low confidence: Unified GCS/Azure/local file interface)
- `google-generativeai` #981, 14M per month
- `opentelemetry-distro` #984, 14M per month
- `microsoft-kiota-authentication-azure` #987, 14M per month
- `opentelemetry-resourcedetector-gcp` #988, 14M per month

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `pluggy` #16, 848M per month
- `pycparser` #18, 826M per month
- `fsspec` #38, 557M per month
- `aiohappyeyeballs` #66, 399M per month
- `importlib-metadata` #80, 355M per month
- `oauthlib` #125, 220M per month
- `docstring-parser` #133, 210M per month
- `fonttools` #149, 185M per month
- `prompt_toolkit` #152, 180M per month
- `alembic` #153, 178M per month
- `kiwisolver` #181, 151M per month
- `keyring` #195, 145M per month
- `cycler` #201, 140M per month
- `execnet` #206, 137M per month
- `contourpy` #211, 135M per month
- `async-timeout` #236, 122M per month
- `aiofiles` #239, 118M per month
- `traitlets` #242, 117M per month
- `multiprocess` #252, 108M per month
- `authlib` #256, 106M per month
- `truststore` #257, 105M per month
- `parso` #275, 94M per month
- `python-docx` #277, 94M per month
- `nbformat` #317, 75M per month
- `datasets` #320, 74M per month
- `jsonref` #336, 69M per month
- `onnxruntime` #351, 65M per month
- `linkify-it-py` #355, 64M per month
- `scramp` #370, 60M per month
- `python-pptx` #373, 60M per month
- `shapely` #379, 59M per month
- `smart-open` #386, 57M per month
- `aiofile` #400, 54M per month
- `caio` #406, 52M per month
- `synchronicity` #412, 52M per month
- `nbclient` #422, 50M per month
- `nbconvert` #427, 49M per month
- `pkginfo` #443, 46M per month
- `amqp` #448, 45M per month
- `vine` #467, 42M per month
- `orderly-set` #488, 40M per month
- `pymssql` #520, 38M per month
- `langchain-text-splitters` #530, 37M per month
- `fqdn` #545, 35M per month
- `junitparser` #552, 35M per month
- `phonenumbers` #557, 34M per month
- `license-expression` #566, 34M per month
- `graphviz` #573, 33M per month
- `pyphen` #574, 33M per month
- `packageurl-python` #584, 32M per month
- `unidiff` #598, 31M per month
- `entrypoints` #604, 31M per month
- `stevedore` #609, 30M per month
- `xgboost` #616, 30M per month
- `cyclonedx-python-lib` #617, 30M per month
- `patsy` #623, 29M per month
- `pip-api` #647, 28M per month
- `selenium` #649, 28M per month
- `ml-dtypes` #653, 27M per month
- `clickhouse-connect` #654, 27M per month
- `pyodbc` #669, 27M per month
- `olefile` #673, 27M per month
- `catalogue` #676, 26M per month
- `snowballstemmer` #687, 25M per month
- `genai-prices` #714, 24M per month
- `userpath` #719, 23M per month
- `mock` #720, 23M per month
- `respx` #723, 23M per month
- `pydantic-graph` #727, 23M per month
- `swebench` #740, 23M per month
- `sentence-transformers` #742, 22M per month
- `soundfile` #751, 22M per month
- `vcrpy` #752, 22M per month
- `spacy` #772, 21M per month
- `pyproj` #774, 21M per month
- `resolvelib` #775, 21M per month
- `questionary` #778, 21M per month
- `requests-mock` #789, 20M per month
- `pyiceberg` #825, 19M per month
- `imagesize` #830, 19M per month
- `gql` #837, 18M per month
- `oracledb` #845, 18M per month
- `pydub` #853, 18M per month
- `oscrypto` #873, 17M per month
- `maxminddb` #876, 17M per month
- `pdf2image` #894, 16M per month
- `pydot` #903, 16M per month
- `mammoth` #922, 16M per month
- `pywavelets` #944, 15M per month
- `optuna` #945, 15M per month
- `genson` #951, 15M per month
- `markitdown` #962, 14M per month
- `pyspnego` #966, 14M per month
- `service-identity` #972, 14M per month
- `h3` #973, 14M per month
- `parse` #985, 14M per month
- `slicer` #986, 14M per month
- `pip-requirements-parser` #989, 14M per month
- `inquirerpy` #994, 14M per month
- `readchar` #1000, 12M per month

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `setuptools` #10, 927M per month
- `pytest` #24, 755M per month
- `wheel` #81, 344M per month
- `hatchling` #90, 316M per month
- `ruff` #95, 300M per month
- `coverage` #105, 277M per month
- `virtualenv` #119, 232M per month
- `pytest-asyncio` #123, 223M per month
- `editables` #128, 213M per month
- `distlib` #132, 210M per month
- `pytest-cov` #139, 198M per month
- `nodeenv` #157, 173M per month
- `mypy` #178, 152M per month
- `pre-commit` #194, 145M per month
- `pytest-xdist` #208, 136M per month
- `pytest-json-ctrf` #229, 125M per month
- `black` #249, 112M per month
- `jedi` #268, 95M per month (low confidence: autocompletion engine for editors)
- `playwright` #271, 95M per month (low confidence: browser automation mainly for testing)
- `pyproject-hooks` #281, 92M per month
- `isort` #288, 89M per month
- `build` #290, 89M per month
- `poetry-core` #300, 84M per month
- `pytest-timeout` #303, 83M per month
- `pytest-mock` #304, 82M per month
- `setuptools-scm` #309, 77M per month
- `debugpy` #310, 77M per month (low confidence: debugger adapter; dev-time tool)
- `cython` #312, 77M per month
- `vcs-versioning` #315, 75M per month
- `mccabe` #340, 68M per month
- `griffelib` #356, 64M per month (low confidence: API signature extraction for docs)
- `invoke` #374, 60M per month
- `pycodestyle` #385, 57M per month
- `responses` #408, 52M per month
- `hypothesis` #409, 52M per month
- `numba` #416, 51M per month (low confidence: JIT compiler)
- `installer` #424, 49M per month
- `pyflakes` #445, 46M per month
- `freezegun` #453, 44M per month
- `triton` #471, 41M per month
- `pyright` #487, 40M per month
- `flake8` #497, 39M per month
- `ty` #500, 39M per month
- `pylint` #525, 37M per month
- `pytest-rerunfailures` #526, 37M per month
- `moto` #539, 36M per month
- `testcontainers` #597, 31M per month
- `pytest-split` #668, 27M per month
- `pytest-runner` #688, 25M per month
- `bandit` #703, 24M per month
- `yamllint` #704, 24M per month
- `diff_cover` #711, 24M per month
- `flit-core` #716, 24M per month
- `ninja` #739, 23M per month
- `import-linter` #779, 20M per month
- `time-machine` #805, 20M per month
- `pytest-env` #811, 20M per month
- `weasel` #829, 19M per month (low confidence: spaCy workflow runner)
- `pytest-httpx` #832, 19M per month
- `jupyter-builder` #857, 18M per month
- `hatch-vcs` #861, 18M per month
- `semgrep` #863, 17M per month
- `sphinx` #866, 17M per month
- `poetry-plugin-export` #879, 17M per month
- `pbr` #881, 17M per month
- `griffecli` #921, 16M per month
- `mkdocs-get-deps` #935, 16M per month
- `maturin` #937, 15M per month
- `uv-build` #947, 15M per month
- `vulture` #953, 15M per month
- `deptry` #969, 14M per month
- `tox` #970, 14M per month
- `pytest-randomly` #979, 14M per month
- `basedpyright` #992, 14M per month
- `ipdb` #997, 14M per month

## Framework and tool extensions

Plugins, engines, adapters, middleware and asset bundles that only work inside one host framework or tool, such as Rails engines, Rack middleware, OmniAuth strategies, Faraday adapters and Fluentd or Logstash plugins; the host frameworks themselves and build or test tooling plugins are out of scope.

- `pydantic-settings` #78, 358M per month (low confidence: uncertain fit)
- `requests-oauthlib` #115, 240M per month
- `sse-starlette` #118, 233M per month
- `requests-toolbelt` #144, 190M per month
- `httpx-sse` #173, 155M per month
- `asgiref` #244, 116M per month (low confidence: ASGI helpers and adapters)
- `matplotlib-inline` #284, 91M per month
- `cachecontrol` #308, 79M per month
- `rich-toolkit` #324, 73M per month (low confidence: CLI building helpers on top of rich)
- `mdit-py-plugins` #341, 67M per month
- `rich-rst` #362, 62M per month (low confidence: rst renderer plugin for rich)
- `requests-file` #368, 61M per month
- `argcomplete` #389, 55M per month (low confidence: shell completion for argparse)
- `ipython-pygments-lexers` #395, 54M per month
- `pydantic-extra-types` #419, 50M per month (low confidence: extra types for pydantic)
- `click-repl` #421, 50M per month
- `jupyterlab-pygments` #436, 47M per month
- `pandocfilters` #437, 47M per month
- `click-plugins` #451, 44M per month
- `click-didyoumean` #482, 40M per month
- `flask-cors` #499, 39M per month
- `llama-index-indices-managed-llama-cloud` #509, 38M per month
- `fastapi-cli` #511, 38M per month (low confidence: CLI launcher for FastAPI)
- `psycopg-pool` #543, 36M per month (low confidence: connection pool add-on, excluded from postgres-client)
- `llama-index-llms-openai` #569, 33M per month
- `pgvector` #603, 31M per month (low confidence: adapters for vector type across DB drivers)
- `terminado` #621, 29M per month
- `jupyter-server-terminals` #638, 28M per month
- `graphql-relay` #641, 28M per month
- `db-dtypes` #650, 28M per month
- `jupyter-lsp` #674, 26M per month
- `click-option-group` #699, 24M per month
- `opentelemetry-instrumentation-urllib` #701, 24M per month (low confidence: instrumentation plugin)
- `djangorestframework` #710, 24M per month
- `opentelemetry-instrumentation-aiohttp-client` #760, 21M per month
- `pytest-metadata` #762, 21M per month
- `slowapi` #763, 21M per month
- `pytest-django` #776, 21M per month
- `rich-argparse` #777, 21M per month (low confidence: argparse help formatter)
- `sqlalchemy-spanner` #807, 20M per month
- `spacy-loggers` #824, 19M per month
- `django-cors-headers` #838, 18M per month
- `sqlalchemy-utils` #847, 18M per month
- `grpcio-health-checking` #849, 18M per month
- `pymdown-extensions` #850, 18M per month
- `sphinxcontrib-jsmath` #854, 18M per month
- `flask-login` #880, 17M per month
- `rich-click` #882, 17M per month
- `pyyaml-env-tag` #891, 17M per month (low confidence: YAML tag plugin for env vars)
- `alabaster` #893, 16M per month
- `sphinxcontrib-serializinghtml` #898, 16M per month
- `sphinxcontrib-applehelp` #912, 16M per month
- `swifter` #915, 16M per month (low confidence: Accelerator plugin for pandas apply; no category for it)
- `sphinxcontrib-devhelp` #920, 16M per month
- `sphinxcontrib-htmlhelp` #925, 16M per month
- `sphinxcontrib-qthelp` #927, 16M per month
- `grpc-interceptor` #954, 15M per month
- `whitenoise` #990, 14M per month

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `cryptography` #9, 1.1B per month (low confidence: broad crypto primitives library)
- `scipy` #102, 289M per month
- `more-itertools` #126, 219M per month
- `scikit-learn` #150, 183M per month
- `langchain` #161, 170M per month
- `langchain-core` #196, 144M per month
- `tornado` #267, 96M per month
- `transformers` #274, 95M per month
- `torch` #378, 59M per month
- `toolz` #393, 55M per month (low confidence: functional utility library)
- `textual` #398, 54M per month
- `fastmcp` #401, 53M per month (low confidence: MCP server framework)
- `fastmcp-slim` #438, 47M per month
- `pycryptodomex` #444, 46M per month (low confidence: broad crypto library)
- `py` #449, 45M per month (low confidence: legacy py library with many unrelated utilities)
- `langgraph` #454, 44M per month
- `nltk` #473, 41M per month
- `django` #483, 40M per month
- `absl-py` #486, 40M per month
- `strands-agents` #527, 37M per month
- `fastcore` #562, 34M per month
- `tf-keras-nightly` #580, 32M per month
- `statsmodels` #592, 31M per month (low confidence: broad statistics library)
- `langchain-community` #662, 27M per month (low confidence: broad integrations library)
- `graphene` #672, 27M per month
- `pydantic-ai-slim` #721, 23M per month
- `boltons` #756, 22M per month
- `thinc` #785, 20M per month (low confidence: ML framework)
- `mlflow` #802, 20M per month
- `python-utils` #803, 20M per month (low confidence: general utility grab-bag)
- `streamlit` #816, 19M per month
- `great-expectations` #821, 19M per month (low confidence: data quality framework, broad)
- `lightgbm` #839, 18M per month (low confidence: gradient boosting ML library)
- `accelerate` #856, 18M per month (low confidence: ML training helper library)
- `torchvision` #924, 16M per month
- `langchain-classic` #977, 14M per month

## Platform-specific binaries

Packages that only carry a prebuilt native executable or addon for one OS and CPU architecture.

- `nvidia-nccl-cu12` #431, 48M per month
- `polars-runtime-32` #458, 43M per month
- `nvidia-cusolver-cu12` #461, 43M per month
- `nvidia-cudnn-cu13` #472, 41M per month
- `cuda-toolkit` #476, 41M per month (low confidence: meta-package of CUDA libraries)
- `nvidia-cufft` #501, 39M per month
- `nvidia-nvshmem-cu13` #502, 39M per month
- `nvidia-cublas` #503, 39M per month
- `nvidia-cusolver` #508, 38M per month
- `nvidia-nvtx` #521, 37M per month
- `nvidia-cuda-runtime` #533, 37M per month
- `nvidia-cuda-cupti` #540, 36M per month
- `nvidia-nccl-cu13` #542, 36M per month
- `nvidia-cusparselt-cu13` #549, 35M per month
- `nvidia-cufile` #563, 34M per month
- `nvidia-cuda-nvrtc` #571, 33M per month
- `nvidia-nvjitlink` #577, 33M per month
- `nvidia-cusparse` #578, 33M per month
- `nvidia-cufft-cu12` #643, 28M per month
- `nvidia-cuda-cupti-cu12` #655, 27M per month
- `nvidia-cusparse-cu12` #659, 27M per month
- `nvidia-curand` #670, 27M per month
- `nvidia-curand-cu12` #675, 26M per month
- `nvidia-cuda-nvrtc-cu12` #679, 26M per month
- `nvidia-nvjitlink-cu12` #692, 25M per month
- `nvidia-nvtx-cu12` #722, 23M per month
- `blis` #733, 23M per month (low confidence: BLAS C-extension)
- `aws-cdk.asset-awscli-v1` #769, 21M per month
- `nvidia-cusparselt-cu12` #842, 18M per month
- `nvidia-cudnn-cu12` #843, 18M per month
- `nvidia-cublas-cu12` #959, 15M per month
- `nvidia-cuda-runtime-cu12` #983, 14M per month

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `pydantic_core` #23, 777M per month
- `propcache` #56, 437M per month
- `referencing` #57, 437M per month (low confidence: uncertain fit)
- `mdurl` #61, 420M per month (low confidence: uncertain fit)
- `smmap` #191, 146M per month
- `hpack` #192, 146M per month (low confidence: HTTP/2 header compression piece of the h2 stack)
- `hyperframe` #198, 142M per month
- `psycopg-binary` #222, 127M per month (low confidence: C optimisation piece of psycopg)
- `librt` #241, 118M per month (low confidence: mypyc runtime)
- `jupyter-core` #322, 74M per month (low confidence: base package for Jupyter projects)
- `ast-serialize` #323, 73M per month
- `jupyter-client` #329, 70M per month (low confidence: Jupyter protocol client)
- `ruamel.yaml.clib` #364, 62M per month
- `comm` #388, 55M per month
- `langgraph-checkpoint` #474, 41M per month
- `langgraph-prebuilt` #490, 40M per month
- `jupyter-events` #632, 28M per month (low confidence: Jupyter-specific event system)
- `notebook-shim` #635, 28M per month
- `jupyterlab-server` #642, 28M per month
- `dbt-semantic-interfaces` #645, 28M per month (low confidence: dbt shared definitions)
- `dbt-adapters` #689, 25M per month
- `dbt-extractor` #693, 25M per month
- `dbt-common` #708, 24M per month
- `spacy-legacy` #757, 22M per month
- `cymem` #790, 20M per month
- `feedparser-sgmllib` #933, 16M per month

## System and foreign bindings

Bindings to operating system APIs, C libraries and other language runtimes, whose work is done by the code they wrap; prebuilt per-platform import libraries are out of scope.

- `cffi` #11, 912M per month
- `uvloop` #129, 212M per month (low confidence: asyncio event loop wrapping libuv)
- `pyopenssl` #160, 170M per month
- `pynacl` #165, 162M per month
- `jeepney` #200, 141M per month
- `secretstorage` #207, 137M per month
- `tree-sitter` #240, 118M per month
- `pyzmq` #289, 89M per month
- `pyperclip` #330, 70M per month (low confidence: clipboard access via OS tools)
- `py4j` #342, 67M per month
- `llvmlite` #417, 50M per month
- `cuda-bindings` #581, 32M per month
- `setproctitle` #582, 32M per month
- `send2trash` #594, 31M per month (low confidence: native trash operations)
- `av` #622, 29M per month
- `delta-spark` #646, 28M per month (low confidence: Python API over Spark Delta Lake)
- `h5py` #684, 25M per month (low confidence: wraps HDF5 C library)
- `lupa` #758, 22M per month
- `pybind11` #798, 20M per month
- `xattr` #835, 19M per month
- `pytesseract` #904, 16M per month
- `sounddevice` #917, 16M per month
- `pillow-heif` #918, 16M per month
- `nvidia-ml-py` #975, 14M per month
- `jpype1` #998, 14M per month

## Type definitions

Packages that ship only TypeScript types and have no runtime code.

- `annotated-types` #26, 721M per month (low confidence: runtime constraint types)
- `annotated-doc` #74, 377M per month (low confidence: runtime Annotated doc helper)
- `types-requests` #319, 74M per month
- `types-pyyaml` #326, 73M per month
- `types-protobuf` #359, 63M per month
- `types-toml` #383, 58M per month
- `types-certifi` #405, 53M per month
- `botocore-stubs` #440, 46M per month
- `types-s3transfer` #456, 43M per month
- `types-python-dateutil` #481, 40M per month
- `mypy-boto3-s3` #512, 38M per month
- `boto3-stubs` #544, 36M per month
- `types-awscrt` #570, 33M per month
- `types-pytz` #658, 27M per month
- `types-setuptools` #732, 23M per month
- `pandas-stubs` #855, 18M per month
- `types-urllib3` #883, 17M per month
- `types-cachetools` #910, 16M per month
- `types-redis` #931, 16M per month
- `types-cffi` #941, 15M per month
- `types-paramiko` #957, 15M per month
- `mypy-boto3-rds` #976, 14M per month

## Language-level abstractions

Trait definitions, declarative macros, error types, lazy statics, marker and wrapper types that shape code at compile time and have no standalone runtime task.

- `attrs` #29, 686M per month (low confidence: uncertain fit)
- `wrapt` #72, 382M per month (low confidence: uncertain fit)
- `decorator` #199, 141M per month
- `jaraco.classes` #202, 140M per month
- `jaraco.functools` #203, 139M per month
- `jaraco.context` #209, 136M per month
- `deprecated` #226, 126M per month
- `deprecation` #372, 60M per month (low confidence: deprecation decorators)
- `zope.interface` #434, 48M per month
- `strenum` #484, 40M per month
- `crashtest` #506, 39M per month (low confidence: Python error-handling helper, unsure of task)
- `outcome` #588, 32M per month
- `aenum` #629, 29M per month
- `lazy-object-proxy` #637, 28M per month
- `overrides` #640, 28M per month
- `cached-property` #819, 19M per month (low confidence: property caching decorator)
- `makefun` #836, 18M per month (low confidence: dynamic function creation)
- `constantly` #993, 14M per month (low confidence: Symbolic constants/enum helper)

## Applications and daemons

Complete servers, daemons, command-line programs and websites that happen to be published as importable packages and are run rather than called for one task; build, lint and test tools and reusable frameworks are out of scope.

- `pip` #65, 401M per month
- `uv` #224, 126M per month
- `ipython` #272, 95M per month
- `awscli` #295, 85M per month
- `ipykernel` #396, 54M per month (low confidence: Jupyter kernel process)
- `poetry` #477, 41M per month
- `pbs-installer` #553, 34M per month (low confidence: installer tool for Python Build Standalone)
- `jupyter-server` #585, 32M per month
- `fastapi-cloud-cli` #601, 31M per month
- `jupyterlab` #611, 30M per month
- `notebook` #634, 28M per month
- `pip-audit` #667, 27M per month
- `dbt-core` #741, 22M per month
- `py-spy` #784, 20M per month (low confidence: profiler CLI, no description)
- `twine` #870, 17M per month
- `tensorboard` #890, 17M per month (low confidence: TensorBoard visualization server)
- `papermill` #897, 16M per month (low confidence: notebook runner)
- `prek` #905, 16M per month

## Tooling internals (AST and code utilities)

Building blocks used inside compilers and linters, such as AST node helpers, traversal, scope analysis, tokenizing and code frames; standalone parsers are out of scope.

- `typing-inspection` #28, 689M per month (low confidence: runtime typing introspection)
- `executing` #261, 102M per month
- `asttokens` #278, 93M per month
- `pure-eval` #286, 89M per month
- `stack-data` #293, 86M per month
- `pytokens` #327, 73M per month
- `astroid` #515, 38M per month
- `bytecode` #519, 38M per month (low confidence: bytecode manipulation)
- `libcst` #524, 37M per month (low confidence: Python concrete syntax tree parser)
- `griffe` #747, 22M per month
- `grimp` #765, 21M per month
- `requirements-parser` #771, 21M per month (low confidence: requirements file parser)
- `google-pasta` #844, 18M per month

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `typing-extensions` #3, 1.4B per month
- `six` #15, 876M per month
- `mypy-extensions` #112, 249M per month
- `exceptiongroup` #122, 226M per month
- `nest-asyncio` #307, 80M per month (low confidence: patches asyncio to allow nested loops)
- `importlib-resources` #358, 63M per month
- `typing-inspect` #365, 61M per month (low confidence: runtime typing introspection helpers)
- `pyarrow-hotfix` #450, 44M per month (low confidence: hotfix shim)
- `future` #464, 43M per month
- `nest-asyncio2` #605, 31M per month
- `lazy-loader` #698, 24M per month
- `eval-type-backport` #753, 22M per month
- `pathlib-abc` #996, 14M per month

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `urllib3` #4, 1.3B per month
- `requests` #7, 1.2B per month
- `httpcore` #31, 609M per month
- `httpx` #33, 608M per month
- `aiohttp` #53, 448M per month (low confidence: client and server framework)
- `httpx2` #137, 202M per month
- `httpcore2` #138, 201M per month
- `httplib2` #243, 117M per month
- `curl-cffi` #579, 33M per month
- `zeep` #625, 29M per month (low confidence: SOAP client, not a plain HTTP client)
- `elastic-transport` #780, 20M per month (low confidence: transport layer for Elastic clients)
- `python-http-client` #808, 20M per month

## Date and time

Parse, format and do calendar arithmetic on dates, times and durations; time zone database packages, HTTP-date-only helpers and clock sources are out of scope.

- `python-dateutil` #14, 887M per month
- `pytz` #70, 387M per month (low confidence: loose functional fit)
- `isodate` #159, 171M per month
- `croniter` #316, 75M per month (low confidence: cron schedule iteration over datetimes)
- `rfc3339-validator` #380, 58M per month (low confidence: validates RFC3339 timestamps)
- `arrow` #381, 58M per month
- `pdfminer.six` #402, 53M per month (low confidence: Go-style duration string conversion)
- `pendulum` #411, 52M per month
- `dateparser` #514, 38M per month
- `isoduration` #534, 37M per month
- `pytimeparse` #743, 22M per month (low confidence: duration parsing)
- `parsedatetime` #759, 22M per month

## Environment detection

One-shot probes of the host such as CPU count and features, terminal state, user, host name, time zone and standard directories, which return in constant time and have no workload to scale.

- `platformdirs` #39, 548M per month
- `sniffio` #71, 382M per month
- `psutil` #103, 288M per month
- `distro` #108, 262M per month
- `shellingham` #110, 254M per month
- `threadpoolctl` #158, 172M per month (low confidence: controls native thread pool limits)
- `python-discovery` #162, 169M per month
- `tzlocal` #172, 156M per month
- `cuda-pathfinder` #595, 31M per month (low confidence: locates CUDA components)
- `appdirs` #685, 25M per month
- `py-cpuinfo` #907, 16M per month
- `screeninfo` #946, 15M per month

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `pydantic` #20, 813M per month
- `jsonschema` #49, 462M per month
- `email-validator` #169, 158M per month (low confidence: loose functional fit)
- `cfgv` #188, 147M per month
- `fastjsonschema` #258, 105M per month
- `beartype` #331, 70M per month (low confidence: loose functional fit)
- `typeguard` #425, 49M per month (low confidence: runtime type checking of values)
- `validators` #749, 22M per month (low confidence: string validators)
- `schema` #822, 19M per month
- `openapi-schema-validator` #878, 17M per month
- `openapi-spec-validator` #888, 17M per month (low confidence: validates OpenAPI specs against schema)

## Binary serialization

Encode structured values to a compact binary format and decode them back, such as Protocol Buffers, MessagePack, CBOR and bincode; text formats, columnar data and byte-order helpers are out of scope.

- `protobuf` #35, 601M per month
- `msgpack` #147, 187M per month
- `flatbuffers` #311, 77M per month
- `safetensors` #332, 70M per month (low confidence: tensor serialization format; description empty)
- `cbor2` #334, 69M per month
- `thrift` #463, 43M per month
- `ormsgpack` #475, 41M per month
- `msgspec` #575, 33M per month (low confidence: also JSON/YAML/TOML with schema validation)
- `amazon-ion` #576, 33M per month
- `fastavro` #618, 30M per month
- `srsly` #793, 20M per month (low confidence: mixed serialization utilities)

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `click` #19, 817M per month
- `typer` #116, 239M per month
- `cyclopts` #338, 68M per month
- `cleo` #518, 38M per month
- `docopt` #767, 21M per month
- `face` #791, 20M per month
- `fire` #874, 17M per month
- `configargparse` #884, 17M per month
- `typer-slim` #930, 16M per month

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `certifi` #6, 1.3B per month
- `jsonschema-specifications` #59, 432M per month
- `tzdata` #73, 378M per month
- `trove-classifiers` #83, 336M per month
- `opentelemetry-semantic-conventions` #99, 293M per month
- `uc-micro-py` #560, 34M per month
- `pycountry` #610, 30M per month
- `holidays` #666, 27M per month (low confidence: rule-based holiday computation over data tables)
- `ua-parser-builtins` #906, 16M per month (low confidence: Precompiled UA rule tables for ua-parser; data only)

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `lxml` #91, 313M per month
- `beautifulsoup4` #100, 292M per month
- `defusedxml` #143, 194M per month (low confidence: secure wrappers around stdlib XML parsers)
- `xmltodict` #282, 92M per month (low confidence: parses XML into dicts)
- `tinyhtml5` #628, 29M per month
- `html5lib` #700, 24M per month
- `feedparser` #887, 17M per month (low confidence: RSS/Atom feed parser)
- `bs4` #911, 16M per month (low confidence: Dummy package that only depends on beautifulsoup4; no code of its own)

## Typed object mapping

Convert plain dictionaries and lists into instances of declared record classes and back again, following the field types; validation-first schema libraries, binary wire formats and pickling of arbitrary objects are out of scope.

- `proto-plus` #114, 241M per month (low confidence: pythonic wrapper over protobuf messages; not sure of best fit)
- `typedload` #269, 95M per month
- `marshmallow` #302, 83M per month (low confidence: converts objects to/from native types but also validates; could be schema-validation)
- `dataclasses-json` #439, 47M per month
- `cattrs` #567, 33M per month
- `py-serializable` #614, 30M per month
- `mashumaro` #717, 24M per month
- `dacite` #782, 20M per month

## Dataframes

In-memory columnar tables with filter, join, group-by and aggregate operations; compatibility layers over other dataframe libraries, file-format readers alone and remote warehouse clients are out of scope.

- `pandas` #40, 543M per month
- `pyarrow` #86, 330M per month (low confidence: uncertain fit)
- `narwhals` #248, 113M per month
- `duckdb` #399, 54M per month
- `polars` #415, 51M per month
- `pyspark` #435, 48M per month
- `dask` #683, 26M per month
- `agate` #814, 19M per month

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `anyio` #21, 802M per month
- `greenlet` #79, 356M per month (low confidence: loose functional fit)
- `joblib` #168, 159M per month (low confidence: parallel task pipelining; uncertain fit)
- `billiard` #470, 42M per month (low confidence: multiprocessing pool fork)
- `trio` #555, 34M per month (low confidence: async framework broader than a limiter)
- `gevent` #690, 25M per month (low confidence: coroutine network lib)
- `multitasking` #858, 18M per month (low confidence: thread-decorator concurrency helper)

## JSON path queries

Evaluate a path or query expression such as JSONPath, JMESPath or JSON Pointer against in-memory JSON-like data and return the selected values; JSON parsing, JSON Patch and schema validation are out of scope.

- `jmespath` #43, 494M per month
- `jsonpointer` #231, 123M per month
- `jsonschema-path` #346, 65M per month (low confidence: path-style lookup on specs)
- `pathable` #347, 65M per month (low confidence: object-oriented path lookup in dicts and lists)
- `jsonpath-ng` #391, 55M per month
- `jsonpath-python` #680, 26M per month
- `glom` #794, 20M per month (low confidence: declarative nested data access)

## WebSocket messaging

Implement the WebSocket protocol as a client, a server or a bring-your-own-I/O state machine and exchange framed messages; Socket.IO-style layers on top, server-sent events and raw HTTP are out of scope.

- `websockets` #69, 396M per month
- `websocket-client` #166, 161M per month
- `wsproto` #367, 61M per month
- `simple-websocket` #644, 28M per month
- `trio-websocket` #709, 24M per month
- `python-socketio` #764, 21M per month
- `python-engineio` #768, 21M per month

## Generated API and schema types

Packages that consist of message, resource and specification types, mostly generated from Protocol Buffers, OpenAPI or other interface definitions, with no behavior beyond field access and serialization glue; the serialization runtimes and the clients that use the types are out of scope.

- `googleapis-common-protos` #68, 397M per month
- `grpcio-status` #85, 332M per month
- `opentelemetry-proto` #134, 209M per month
- `grpc-google-iam-v1` #266, 96M per month
- `openapi-pydantic` #414, 51M per month
- `google-cloud-audit-log` #591, 31M per month
- `dbt-protos` #901, 16M per month

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `jiter` #92, 312M per month
- `orjson` #156, 174M per month (low confidence: JSON codec; also serializes)
- `simplejson` #478, 41M per month
- `ijson` #494, 40M per month
- `json-repair` #615, 30M per month
- `ujson` #648, 28M per month

## Chart rendering

Turn numeric series into a static chart image or vector file; interactive widget front ends, graph-layout tools such as Graphviz and terminal sparklines are out of scope.

- `matplotlib` #170, 157M per month
- `plotly` #423, 49M per month
- `altair` #516, 38M per month
- `seaborn` #677, 26M per month
- `leather` #826, 19M per month
- `sparklines` #860, 18M per month (low confidence: unicode sparklines)

## PDF reading

Open existing PDF files and extract their text and page structure; creating new PDFs and rasterizing pages through external command-line tools are out of scope.

- `pypdf` #230, 124M per month
- `pymupdf` #305, 82M per month
- `pypdfium2` #371, 60M per month
- `pdfplumber` #489, 40M per month
- `pymupdf-layout` #806, 20M per month
- `pypdf2` #995, 14M per month

## Retry policies

Re-run a failing function according to a policy of attempts, backoff and jitter, or guard it with a circuit breaker; rate limiters, task queues and HTTP-client-specific transports are out of scope.

- `tenacity` #84, 333M per month
- `backoff` #219, 130M per month
- `aiohttp-retry` #556, 34M per month
- `pybreaker` #702, 24M per month
- `retry` #715, 24M per month
- `retrying` #750, 22M per month

## PostgreSQL clients

Speak the PostgreSQL wire protocol to run queries and decode result rows; ORMs, query builders, connection-pool add-ons and drivers for other databases are out of scope.

- `psycopg2-binary` #136, 204M per month
- `psycopg` #218, 131M per month
- `asyncpg` #254, 106M per month
- `psycopg2` #360, 63M per month
- `pg8000` #455, 44M per month
- `redshift-connector` #462, 43M per month (low confidence: Redshift DBAPI driver built on the Postgres protocol)

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `rich` #52, 449M per month (low confidence: uncertain fit)
- `colorama` #113, 243M per month
- `termcolor` #335, 69M per month
- `wasabi` #796, 20M per month (low confidence: console printing toolkit)
- `colorful` #800, 20M per month

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `pyyaml` #13, 901M per month
- `ruamel.yaml` #183, 150M per month
- `json5` #465, 42M per month
- `omegaconf` #660, 27M per month (low confidence: YAML-based config library with interpolation)
- `strictyaml` #761, 21M per month

## Event emitters

In-process publish/subscribe objects with on/off/emit semantics; DOM EventTarget implementations, plugin hook systems and reactive streams are out of scope.

- `aiosignal` #64, 404M per month (low confidence: uncertain fit)
- `blinker` #237, 121M per month
- `pyee` #285, 90M per month
- `events` #589, 32M per month
- `zope.event` #729, 23M per month

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `yarl` #51, 456M per month
- `rfc3986-validator` #583, 32M per month (low confidence: RFC 3986 validator only)
- `rfc3987-syntax` #652, 27M per month (low confidence: only syntactic validation of IRIs)
- `rfc3986` #724, 23M per month
- `hyperlink` #810, 20M per month

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `pyjwt` #36, 575M per month
- `itsdangerous` #171, 157M per month (low confidence: signed/timestamped tokens, similar to JWS but not JWT)
- `joserfc` #264, 97M per month
- `python-jose` #608, 30M per month
- `jwcrypto` #928, 16M per month

## Non-deflate compression

Compress and decompress byte buffers with a codec other than deflate, such as Zstandard, Brotli, LZ4, Snappy or bzip2; deflate, zlib and gzip framing and archive formats are out of scope.

- `zstandard` #177, 153M per month
- `lz4` #297, 85M per month
- `brotli` #301, 83M per month
- `backports.zstd` #433, 48M per month
- `cramjam` #627, 29M per month

## Markdown rendering

Parse CommonMark-style Markdown text and render it to HTML or a syntax tree; converting HTML or office documents to Markdown, reStructuredText and terminal rendering are out of scope.

- `markdown-it-py` #54, 444M per month
- `docutils` #214, 135M per month (low confidence: loose functional fit)
- `markdown` #287, 89M per month
- `mistune` #375, 60M per month
- `readme-renderer` #859, 18M per month (low confidence: renders README markup to HTML)

## Immutable collections

Immutable or persistent maps, lists and sets whose updates return a new version, usually with structural sharing; mutable ordered, sorted or multi-value containers are out of scope.

- `rpds-py` #50, 460M per month
- `frozenlist` #62, 409M per month (low confidence: uncertain fit)
- `pyrsistent` #726, 23M per month
- `frozendict` #886, 17M per month
- `immutabledict` #919, 16M per month

## Image processing

Decode raster images, apply pixel operations such as resize and crop, and encode the result; single-format codecs, header-only size readers and OCR are out of scope.

- `pillow` #60, 427M per month
- `opencv-python-headless` #528, 37M per month
- `imageio` #538, 36M per month
- `opencv-python` #620, 29M per month
- `scikit-image` #695, 25M per month

## Structured logging

Application loggers that format records with levels and key-value fields, as JSON or colored text, and write them to a sink; environment-switched debug loggers, telemetry exporters and vendor log shippers are out of scope.

- `structlog` #276, 94M per month
- `python-json-logger` #296, 85M per month
- `loguru` #349, 65M per month
- `colorlog` #459, 43M per month
- `coloredlogs` #547, 35M per month

## File type detection

Identify the format or media type of a file or buffer from its content and magic numbers; extension-to-MIME lookup tables and image dimension readers are out of scope.

- `identify` #190, 147M per month
- `filetype` #550, 35M per month
- `python-magic` #707, 24M per month
- `magika` #948, 15M per month
- `puremagic` #999, 14M per month

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `fastuuid` #280, 93M per month
- `uuid-utils` #333, 70M per month
- `shortuuid` #868, 17M per month
- `uuid7` #914, 16M per month

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `starlette` #45, 491M per month
- `fastapi` #75, 374M per month
- `werkzeug` #145, 188M per month (low confidence: WSGI toolkit with routing; broader than a router)
- `flask` #215, 135M per month

## UI components and hooks

Browser UI component libraries, icon sets, positioning engines and React hooks, whose work is rendering and interaction rather than one standard computational task.

- `widgetsnbextension` #593, 31M per month
- `jupyterlab-widgets` #600, 31M per month
- `ipywidgets` #606, 31M per month
- `pydeck` #851, 18M per month (low confidence: deck.gl map widget)

## Hash maps

General-purpose in-memory key-value hash tables, including insertion-ordered and concurrent variants; bounded caches, tries, slabs and the hash functions themselves are out of scope.

- `multidict` #47, 468M per month
- `ordered-set` #691, 25M per month (low confidence: insertion-ordered set)
- `bidict` #728, 23M per month
- `preshed` #799, 20M per month

## Parser combinators and generators

Libraries for writing a parser for an arbitrary grammar from combinators or a grammar definition; parsers for one fixed format and lexer-only generators are out of scope.

- `pyparsing` #94, 302M per month
- `lark` #363, 62M per month
- `antlr4-python3-runtime` #432, 48M per month
- `ply` #686, 25M per month

## TOML parsing

Parse TOML text into values or a document tree; JSON-superset formats such as YAML and JSON5, INI files and layered configuration loaders are out of scope.

- `tomlkit` #55, 443M per month
- `tomli` #109, 256M per month
- `toml` #213, 135M per month
- `tomli-w` #339, 68M per month (low confidence: loose functional fit)

## Object graph pickling

Serialize arbitrary live language objects, including functions, closures and class instances, to bytes or text and restore them; schema-driven formats and typed record mapping are out of scope.

- `cloudpickle` #164, 164M per month
- `dill` #184, 149M per month
- `tblib` #718, 23M per month (low confidence: traceback serialization)
- `jsonpickle` #991, 14M per month

## PDF generation

Produce new PDF documents from text, tables and drawing commands or from HTML; reading, splitting and merging existing PDFs are out of scope.

- `reportlab` #345, 65M per month
- `weasyprint` #599, 31M per month
- `pydyf` #631, 28M per month
- `fpdf2` #875, 17M per month

## File locking

Acquire and release cross-process advisory locks backed by a lock file; in-process mutexes and distributed locks held in a remote service are out of scope.

- `filelock` #46, 482M per month
- `portalocker` #447, 45M per month
- `locket` #896, 16M per month
- `lockfile` #949, 15M per month

## Character encoding detection

Guess the character encoding of a byte buffer of unknown text; transcoding between known encodings and encoding alias tables are out of scope.

- `charset-normalizer` #8, 1.2B per month
- `chardet` #167, 160M per month
- `webencodings` #247, 113M per month (low confidence: loose functional fit)
- `cchardet` #980, 14M per month

## Password hashing

Hash and verify passwords with a deliberately slow, salted algorithm such as bcrypt, scrypt or Argon2; fast message digests, HMAC and general key derivation are out of scope.

- `bcrypt` #180, 151M per month
- `argon2-cffi-bindings` #366, 61M per month (low confidence: low-level bindings, only Argon2)
- `argon2-cffi` #382, 58M per month
- `passlib` #607, 31M per month

## HTTP message parsing

Parse raw HTTP/1.x request and response bytes into method, target, headers and body chunks; full clients and servers, URL parsing and parsers for a single header are out of scope.

- `h11` #27, 701M per month
- `python-multipart` #82, 338M per month (low confidence: uncertain fit)
- `httptools` #130, 211M per month
- `h2` #193, 145M per month (low confidence: loose functional fit)

## Semantic version comparison

Parse semantic version strings, order them and test them against range constraints; language-specific version schemes with no range syntax and dependency resolvers are out of scope.

- `packaging` #2, 1.5B per month
- `semver` #348, 65M per month
- `semantic-version` #504, 39M per month
- `dunamai` #841, 18M per month (low confidence: dynamic version generation from VCS)

## Embedded key-value stores

Persistent, ordered key-value databases that run inside the application process and store data in local files, such as B+tree and LSM-tree engines; in-memory caches, SQL engines and clients for a database server are out of scope.

- `py-key-value-aio` #353, 64M per month (low confidence: loose functional fit)
- `diskcache` #706, 24M per month
- `partd` #737, 23M per month (low confidence: appendable key-value storage)
- `burner-redis` #963, 14M per month (low confidence: in-process Redis-compatible store)

## Glob matching

Test whether path strings match a glob pattern, purely in memory; walking the filesystem, gitignore rule sets and brace-only expansion are out of scope.

- `pathspec` #42, 496M per month (low confidence: gitignore-style matching)
- `bracex` #493, 40M per month (low confidence: loose functional fit)
- `wcmatch` #523, 37M per month

## Non-cryptographic hashing

Fast hash functions for hash tables and fingerprints, such as FNV, xxHash, SipHash and Murmur; cryptographic digests and error-detecting checksums are out of scope.

- `xxhash` #221, 128M per month
- `mmh3` #387, 55M per month
- `murmurhash` #773, 21M per month

## ASN.1 DER decoding

Parse and encode ASN.1 structures in BER or DER, including X.509 certificates; PEM text framing, certificate chain verification and TLS are out of scope.

- `pyasn1` #67, 398M per month
- `pyasn1-modules` #87, 327M per month (low confidence: uncertain fit)
- `asn1crypto` #217, 132M per month

## HTML sanitizing

Strip disallowed tags, attributes and scripts from untrusted HTML according to an allow-list and return safe HTML; plain entity escaping and general HTML parsing are out of scope.

- `bleach` #376, 60M per month
- `nh3` #568, 33M per month
- `lxml-html-clean` #899, 16M per month

## CSS selector matching

Compile CSS selectors and find the matching elements in an already parsed HTML or XML tree; parsing whole stylesheets and parsing the document itself are out of scope.

- `soupsieve` #98, 293M per month
- `cssselect2` #430, 48M per month
- `cssselect` #823, 19M per month

## Text table rendering

Lay out rows of values as an aligned plain-text or ASCII table; full terminal UI toolkits, progress bars and spreadsheet files are out of scope.

- `tabulate` #179, 151M per month
- `prettytable` #496, 39M per month
- `texttable` #840, 18M per month

## Subword tokenization

Encode text into the integer token ids of a trained subword vocabulary such as BPE or unigram, and decode them back; linguistic word tokenizers, stemmers and model inference are out of scope.

- `tiktoken` #154, 176M per month
- `tokenizers` #163, 166M per month
- `sentencepiece` #664, 27M per month

## MySQL clients

Speak the MySQL wire protocol to run queries and decode result rows; ORMs, query builders and drivers for other databases are out of scope.

- `pymysql` #318, 75M per month
- `mysql-connector-python` #630, 29M per month
- `mysqlclient` #908, 16M per month

## Background job queues

Enqueue jobs to a persistent backend such as Redis or a database and execute them in worker processes or threads; in-process task pools, cron-style schedulers and message-broker clients are out of scope.

- `kombu` #457, 43M per month (low confidence: loose functional fit)
- `celery` #466, 42M per month
- `huey` #982, 14M per month

## Redis clients

Speak the Redis protocol to send commands and decode replies; key namespacing wrappers, cache or session stores built on a client, in-memory fakes and job queues are out of scope.

- `redis` #140, 197M per month
- `fakeredis` #536, 37M per month (low confidence: loose functional fit)
- `hiredis` #656, 27M per month

## Cron expression scheduling

Parse cron expressions and compute the next matching run times, optionally firing callbacks on that schedule; persistent job queues, process managers and general date arithmetic are out of scope.

- `apscheduler` #561, 34M per month
- `cron-descriptor` #877, 17M per month (low confidence: describes cron expressions only)
- `cronsim` #968, 14M per month

## Edit distance and string similarity

Score how similar two strings are with Levenshtein, Jaro-Winkler or a related metric, or pick the closest match from a list; producing the actual diff hunks and phonetic or full-text search are out of scope.

- `rapidfuzz` #246, 114M per month
- `pfzy` #633, 28M per month (low confidence: fuzzy string matching/ranking against a list)
- `levenshtein` #932, 16M per month

## SQL parsing

Parse SQL statements into tokens or a syntax tree; executing queries, database drivers, query builders and object-relational mappers are out of scope.

- `sqlparse` #253, 107M per month
- `sqlglot` #328, 71M per month
- `py-partiql-parser` #867, 17M per month (low confidence: PartiQL parser)

## Linear algebra and arrays

Dense vector, matrix and n-dimensional array types with element-wise arithmetic, matrix multiplication and decompositions; dataframes, arbitrary-precision numbers and machine learning frameworks are out of scope.

- `numpy` #22, 792M per month
- `einops` #781, 20M per month (low confidence: tensor reshaping ops)
- `opt-einsum` #938, 15M per month (low confidence: einsum path optimization)

## Object-relational mapping

Map declared model classes or structs to SQL tables, generate the statements for create, read, update and delete, and hydrate result rows into objects; bare database drivers, SQL parsers and schema migration tools are out of scope.

- `sqlalchemy` #88, 327M per month
- `peewee` #510, 38M per month
- `sqlmodel` #730, 23M per month

## Git repository access

Read and write Git repositories from a program: walk commit history, read trees and blobs and create commits; hosting-service API clients, repository URL parsers and unified diff parsers are out of scope.

- `gitdb` #176, 154M per month (low confidence: git object database only, partial fit)
- `gitpython` #182, 151M per month
- `dulwich` #420, 50M per month

## Deep equality

Compare two JavaScript values for structural equality; assertion libraries, diff output and shallow comparison are out of scope.

- `durationpy` #403, 53M per month (low confidence: object deep diff, nearest is comparison)
- `deepdiff` #404, 53M per month (low confidence: loose functional fit)

## Child process execution

Spawn a child process and collect its exit status and output; shell-string quoting, PATH lookup and signal tables are out of scope.

- `ptyprocess` #233, 123M per month (low confidence: spawns child in a pty; closest fit)
- `pexpect` #238, 121M per month (low confidence: drives interactive child processes; closest fit)

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `fastar` #492, 40M per month
- `backports.tarfile` #507, 39M per month

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `sympy` #227, 125M per month (low confidence: loose functional fit)
- `mpmath` #228, 125M per month

## LRU caches

Bounded in-memory key-value caches that evict the least recently used entry; unbounded maps, memoization decorators and remote cache clients are out of scope.

- `cachetools` #121, 229M per month
- `async-lru` #559, 34M per month

## Bit sets

Compact collections of bits with set, test and bulk boolean operations; flag-enum macros and compressed bitmaps for serialization are out of scope.

- `pyroaring` #671, 27M per month (low confidence: roaring compressed bitmaps; bit-sets excludes compressed bitmaps for serialization but closest)
- `bitarray` #934, 16M per month

## Checksums

Compute error-detecting checksums such as CRC-32, CRC-32C and Adler-32 over byte buffers; cryptographic digests and hash-table hashes are out of scope.

- `google-crc32c` #205, 137M per month
- `crc32c` #587, 32M per month

## Regular expression matching

Compile regular expressions and search text with them; regex syntax parsers on their own, glob matching and literal substring search are out of scope.

- `regex` #93, 304M per month
- `google-re2` #846, 18M per month

## Digital signatures

Generate key pairs, sign messages and verify signatures with ECDSA, Ed25519 or RSA; signature trait definitions, JWT framing and certificate handling are out of scope.

- `rsa` #148, 187M per month
- `ecdsa` #498, 39M per month

## Identifier case conversion

Convert strings between naming conventions such as camelCase, snake_case and kebab-case; Unicode case folding and case-insensitive comparison are out of scope.

- `python-slugify` #361, 63M per month (low confidence: loose functional fit)
- `inflection` #546, 35M per month

## Template rendering

Compile a text template with embedded expressions, loops and partials (ERB, Haml, Slim, Liquid, Mustache and the like) and render it to a string with given data; Markdown conversion, HTML builders driven purely by code and framework view layers are out of scope.

- `jinja2` #41, 526M per month
- `mako` #151, 181M per month

## HTTP application servers

Listen on a socket, parse HTTP requests and hand them to an application callback through the language's standard server interface (Rack, WSGI/ASGI and the like); routers, middleware, reverse proxies and process supervisors are out of scope.

- `uvicorn` #44, 492M per month
- `gunicorn` #270, 95M per month

## Dotenv loading

Parse a .env file of KEY=value lines, with quoting and variable expansion, and load the pairs into the process environment or a map; decoding environment variables into typed structs and general INI or configuration managers are out of scope.

- `python-dotenv` #37, 574M per month
- `envier` #548, 35M per month (low confidence: loose functional fit)

## File system watching

Subscribe to create, write, rename and remove notifications for files and directories through the operating system's notification facility; following the appended lines of one log file and polling build watchers tied to one tool are out of scope.

- `watchfiles` #96, 300M per month
- `watchdog` #299, 84M per month

## Human-readable size formatting

Format byte counts and other quantities as short human-readable strings with unit suffixes such as 1.5 MiB, and parse such strings back to numbers; date and duration phrasing, locale-aware number formatting and arbitrary-precision arithmetic are out of scope.

- `humanize` #446, 46M per month
- `humanfriendly` #452, 44M per month (low confidence: broad text-output helpers; size and duration formatting is the main overlap)

## Public suffix lookup

Split a host name into subdomain, registrable domain and public suffix using the Public Suffix List; IDNA conversion, URL parsing and DNS resolution are out of scope.

- `tldextract` #565, 34M per month
- `tld` #950, 15M per month

## URI template expansion

Expand RFC 6570 URI templates with a set of variables into concrete URIs; route pattern matching of incoming paths and general URL parsing are out of scope.

- `uritemplate` #225, 126M per month
- `uri-template` #554, 34M per month

## Terminal progress bars and spinners

Render a progress bar or spinner line for a running task and redraw it as the task advances; interactive prompts, full terminal UI toolkits and plain log output are out of scope.

- `tqdm` #63, 407M per month
- `progressbar2` #820, 19M per month

## Spreadsheet file reading

Open existing spreadsheet workbook files such as XLSX or XLS and read their sheets and cell values; creating workbooks, CSV parsing and dataframes are out of scope.

- `openpyxl` #106, 270M per month
- `xlrd` #344, 66M per month

## ASCII transliteration and slugs

Replace accented and non-Latin characters with their closest ASCII equivalents, optionally producing a URL slug; Unicode normalization forms, case conversion and percent encoding are out of scope.

- `text-unidecode` #350, 65M per month
- `unidecode` #682, 26M per month

## Rate limiting

Decide whether an action for a given key is allowed now under a token bucket, leaky bucket or fixed-window limit; retry and backoff policies, concurrency limiters and gateway products are out of scope.

- `limits` #532, 37M per month
- `ratelimit` #967, 14M per month

## SSH and SFTP clients

Speak the SSH2 protocol as a client to run remote commands and transfer files over SFTP or SCP; SSH servers, deployment tools built on a client and SSH agent or key-file helpers are out of scope.

- `paramiko` #259, 102M per month
- `sshtunnel` #929, 16M per month (low confidence: SSH port forwarding tunnels)

## Kafka clients

Speak the Apache Kafka protocol to produce records to topics and consume them back; clients for other brokers such as AMQP, NATS or MQTT and stream processing frameworks are out of scope.

- `confluent-kafka` #479, 41M per month
- `kafka-python` #892, 16M per month

## gRPC

Implement gRPC clients and servers that exchange Protocol Buffers messages over HTTP/2; the Protocol Buffers encoding alone, gateway proxies and other RPC protocols are out of scope.

- `grpcio` #89, 318M per month
- `grpclib` #392, 55M per month

## SOCKS proxy clients

Open TCP connections through a SOCKS4 or SOCKS5 proxy by performing the client side of the handshake; HTTP CONNECT proxies, SOCKS servers and SSH tunnels are out of scope.

- `pysocks` #491, 40M per month
- `socksio` #797, 20M per month

## Fake data generation

Generate realistic-looking fake values such as names, addresses, emails and dates for tests and fixtures; bare random number generators, unique ID generators and property-based testing frameworks are out of scope.

- `faker` #357, 63M per month
- `factory-boy` #792, 20M per month (low confidence: test fixture factories)

## File existence lookup

Find the first existing file or directory among candidate paths or by walking up parent directories; glob expansion, executable PATH lookup and module resolution are out of scope.

- `findpython` #441, 46M per month (low confidence: loose functional fit)

## CSS stylesheet parsing

Parse a whole CSS stylesheet into an AST or object model; selector-only or value-only parsers, tokenizers and plugin-driven transformers are out of scope.

- `tinycss2` #292, 87M per month

## HTML entity escaping

Escape and unescape HTML special characters and entities in strings; CSS, RegExp and JavaScript string escaping are out of scope.

- `markupsafe` #34, 605M per month

## Object merging

Copy or recursively merge properties of source objects into a target object; cloning a single value, immutable-update libraries and Object.assign ponyfills are out of scope.

- `mergedeep` #770, 21M per month

## Directory walking

Recursively enumerate every file and directory under a root; glob pattern expansion and file watching are out of scope.

- `rignore` #460, 43M per month (low confidence: gitignore-aware directory walker)

## Deflate compression

Compress and decompress byte buffers with deflate, zlib or gzip framing; archive formats and string-oriented LZ codecs are out of scope.

- `zopfli` #535, 37M per month

## Color parsing and conversion

Parse CSS color strings and convert between color spaces such as RGB, HSL and Lab; terminal styling, named-color tables and interpolation are out of scope.

- `webcolors` #517, 38M per month

## Terminal string width

Compute how many terminal columns a string or code point occupies, accounting for wide East Asian characters; wrapping, truncating and stripping styled text are out of scope.

- `wcwidth` #117, 235M per month

## Cryptographic hashing

Compute cryptographic message digests such as SHA-1, SHA-2, SHA-3, BLAKE and MD5; HMAC, key derivation, password hashing and non-cryptographic hashes are out of scope.

- `pycryptodome` #337, 68M per month

## Base64 encoding

Encode bytes to base64 text and decode them back; hexadecimal, base58 and other alphabets, and PEM framing are out of scope.

- `pybase64` #872, 17M per month

## Text diffing

Compute the line or element differences between two texts or sequences; edit-distance scores, assertion pretty-printers and structured JSON patches are out of scope.

- `daff` #895, 16M per month (low confidence: table diff/patch)

## Macro and derive support

Procedural macro and derive crates, the libraries they are built from and code generators, all of which run inside the compiler rather than in the built program.

- `grpcio-tools` #204, 138M per month (low confidence: code generator run at build time)

## User-agent parsing

Parse an HTTP User-Agent header string into browser, version, operating system and device information; full request parsing and bot-blocking middleware are out of scope.

- `ua-parser` #815, 19M per month

## Message translation

Look up translated messages by key or source string in loaded catalogs, with interpolation and plural forms; locale data packages, framework glue and date or number formatting are out of scope.

- `babel` #262, 99M per month (low confidence: i18n utilities incl. gettext catalogs and locale formatting)

## INI and properties parsing

Parse INI-style or Java .properties text of sections and name=value pairs into an in-memory structure; TOML, YAML and other JSON-superset formats, dotenv loading into the process environment and layered configuration managers are out of scope.

- `iniconfig` #25, 739M per month

## Sorted maps and prefix trees

Mutable in-memory key-value containers that keep keys in sorted order, such as B-trees, radix trees and skip lists, and support ordered, range or prefix iteration; hash tables, persistent immutable variants, bounded caches and on-disk stores are out of scope.

- `sortedcontainers` #135, 205M per month

## Metrics instrumentation

In-process registries of counters, gauges, timers and histograms that application code updates and that render a snapshot for a monitoring system; standalone histogram data structures, distributed tracing and vendor agents that only ship data to one service are out of scope.

- `prometheus-client` #216, 135M per month

## MongoDB clients

Speak the MongoDB wire protocol to run commands and encode and decode BSON documents; object-document mappers and drivers for other databases are out of scope.

- `pymongo` #352, 65M per month

## ZIP archiving

Create ZIP archives from in-memory entries and read entries back out of them; tar archives, bare deflate or gzip codecs and other container formats are out of scope.

- `zipp` #76, 364M per month (low confidence: loose functional fit)

## QR code generation

Encode a text or byte payload into a QR code module matrix and render it as SVG, an image or text; QR code scanning and other barcode symbologies are out of scope.

- `qrcode` #636, 28M per month

## Dependency injection containers

Register service providers in a container and resolve instances together with their transitive dependencies at run time; compile-time code generators, framework-bound module systems and plain service locators inside one framework are out of scope.

- `uncalled-for` #413, 52M per month (low confidence: loose functional fit)

## Iterator combinators

Lazy map, filter, take, chunk, zip and similar combinators over synchronous or asynchronous iterables; eager array and object helpers, general utility belts and stream class implementations are out of scope.

- `aioitertools` #294, 85M per month

## IDNA and Punycode conversion

Convert internationalized domain names between Unicode and their ASCII Punycode form according to IDNA or UTS #46; public suffix lookup, full URL parsing and DNS resolution are out of scope.

- `idna` #5, 1.3B per month

## Path string manipulation

Normalize, join, split and relativize file system path strings purely in memory, including separator conversion between platforms; touching the file system, glob matching and URL parsing are out of scope.

- `universal-pathlib` #786, 20M per month (low confidence: pathlib over fsspec backends)

## Layered configuration loading

Merge settings from defaults, configuration files and environment variables into one object and read typed values from it by key; parsers for a single file format, dotenv loading alone and discovery of tool rc files are out of scope.

- `confection` #818, 19M per month (low confidence: config system with registry/interpolation)

## Syntax highlighting

Tokenize source code in a given language and emit it as highlighted HTML or ANSI-colored text; full parsers that build an AST, linters and Markdown rendering are out of scope.

- `pygments` #12, 908M per month

## GraphQL execution

Parse GraphQL documents, validate them against a schema and execute them against in-process resolvers; HTTP clients that only send queries to a remote server and web framework integrations are out of scope.

- `graphql-core` #377, 59M per month

## Spreadsheet file writing

Create spreadsheet workbook files such as XLSX from rows of cell values, with formats and multiple sheets; reading existing workbooks, CSV output and dataframes are out of scope.

- `xlsxwriter` #279, 93M per month

## HTML to Markdown conversion

Convert HTML markup into equivalent Markdown text; rendering Markdown to HTML, HTML sanitizing and readability-style article extraction are out of scope.

- `markdownify` #407, 52M per month

## JSON Patch

Apply RFC 6902 JSON Patch or RFC 7386 merge patch operations to a JSON document, or compute the patch that turns one document into another; path queries that only read values and text diffs are out of scope.

- `jsonpatch` #260, 102M per month

## Noun pluralization

Turn English nouns into their plural or singular form using rules and irregular word lists; identifier case conversion, message translation and stemming for search are out of scope.

- `inflect` #755, 22M per month

## Natural sort order

Compare or sort strings so that embedded numbers are ordered by numeric value, as in file2 before file10; full locale-aware collation and semantic version ordering are out of scope.

- `natsort` #942, 15M per month

## One-time passwords

Generate and verify HOTP and TOTP codes from a shared secret according to RFC 4226 and RFC 6238; password hashing, WebAuthn and full authentication frameworks are out of scope.

- `pyotp` #590, 32M per month

## Single-format image codecs

Decode one raster image format such as PNG, JPEG, GIF, TIFF or WebP to a pixel buffer, and encode pixels back where supported; multi-format image toolkits with resize and crop operations and header-only size readers are out of scope.

- `tifffile` #848, 18M per month

## Graph algorithms

In-memory graph structures of nodes and edges with traversal, topological sort, shortest path and connected component algorithms; graph drawing and layout, graph databases and dependency version solvers are out of scope.

- `networkx` #141, 196M per month

## DNS messages and resolution

Encode and decode DNS wire-format messages and resource records, and use them to query name servers; host name parsing, public suffix lookup and mDNS service discovery are out of scope.

- `dnspython` #124, 222M per month

## SQLite clients

Open a SQLite database from the host language, run statements and decode result rows; object-relational mappers, query builders and drivers for database servers are out of scope.

- `aiosqlite` #369, 61M per month

## Expression evaluation

Parse a single arithmetic or boolean expression given as text and evaluate it against a set of variables; full scripting-language interpreters, template engines and regular expressions are out of scope.

- `boolean.py` #558, 34M per month

## XML building

Produce XML text from code through a builder interface or from nested native data structures; parsing XML, HTML template engines and DOM implementations are out of scope.

- `et-xmlfile` #107, 268M per month
