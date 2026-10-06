# Package categories: RubyGems

1000 of 1000 packages categorized into 123 categories.

| Category | Packages | Benchmarkable | Candidate benchmark |
| --- | ---: | --- | --- |
| Service SDKs and telemetry (`service-sdks`) | 280 | no |  |
| Framework and tool extensions (`framework-extensions`) | 148 | no |  |
| Build, lint and test tooling (`build-tooling`) | 92 | no |  |
| Other (no peers yet) (`other`) | 88 | no |  |
| Library internals (`library-internals`) | 23 | no |  |
| Language-level abstractions (`language-ergonomics`) | 18 | no |  |
| System and foreign bindings (`system-bindings`) | 18 | no |  |
| Frameworks and broad libraries (`frameworks`) | 14 | no |  |
| HTTP clients (`http-client`) | 13 | yes | Issue 10,000 GET requests for a small JSON body to a local HTTP server and parse each response. |
| CLI argument parsing (`cli-argument-parsing`) | 10 | yes | Declare the same set of flags, typed options and positionals, then parse a fixed set of argv arrays into option objects. |
| Child process execution (`process-execution`) | 9 | yes | Spawn the same trivial command 200 times and collect its stdout and exit code. |
| Environment detection (`environment-detection`) | 9 | no |  |
| Terminal string styling (`terminal-styling`) | 8 | yes | Apply a fixed mix of single and nested color/bold/underline styles to 100,000 short strings and concatenate the output. |
| Static data and patterns (`static-data`) | 8 | no |  |
| Template rendering (`template-rendering`) | 8 | yes | Compile a template that loops over 1,000 records with a conditional and escaped interpolation, then render it 1,000 times. |
| Applications and daemons (`applications`) | 8 | no |  |
| JSON parsing (`json-parsing`) | 7 | yes | Parse the same large standard JSON document string into a JavaScript value. |
| Tooling internals (AST and code utilities) (`tooling-internals`) | 6 | no |  |
| Binary serialization (`binary-serialization`) | 6 | yes | Encode and decode 100,000 records with nested integers, strings and arrays. |
| Date and time (`date-time`) | 6 | yes | Parse 100,000 ISO 8601 timestamps, add calendar durations and format each back to a string. |
| Structured logging (`structured-logging`) | 6 | yes | Log 1,000,000 records with five key-value fields each as JSON lines to a null sink. |
| Schema validation (`schema-validation`) | 5 | yes | Define one equivalent nested object schema and validate a fixed batch of valid and invalid JSON documents against it. |
| HTML and XML parsing (`markup-parsing`) | 5 | yes | Parse one large well-formed XHTML document, valid as both HTML and XML, and count the elements seen. |
| Parser combinators and generators (`parser-combinators`) | 5 | yes | Implement the same JSON grammar with each library and parse a 10 MB JSON document. |
| Image processing (`image-processing`) | 5 | yes | Decode a fixed set of JPEG and PNG photos, resize each to a thumbnail and re-encode it. |
| HTTP application servers (`http-application-servers`) | 5 | yes | Serve a fixed 1 KB response from a trivial application callback to 100,000 keep-alive requests from a local load generator. |
| Declared object serializers (`object-json-serialization`) | 5 | yes | Declare a serializer for a record with ten attributes and one nested collection, then serialize a list of 10,000 such records to JSON. |
| Runtime helpers and shims (`runtime-shims`) | 4 | no |  |
| Async concurrency control (`async-concurrency`) | 4 | yes | Run 100,000 trivial async tasks with a concurrency limit of 10 and wait for all of them to settle. |
| HTML sanitizing (`html-sanitizing`) | 4 | yes | Sanitize a fixed set of 1,000 HTML fragments containing scripts, event handlers and unknown tags with a default allow-list. |
| PDF generation (`pdf-generation`) | 4 | yes | Generate a 100-page PDF of paragraphs and a table from fixed input data. |
| WebSocket messaging (`websocket-messaging`) | 4 | yes | Echo 100,000 text and binary messages over a loopback connection, or through the codec in memory. |
| HTTP message parsing (`http-message-parsing`) | 4 | yes | Parse a fixed buffer of 100,000 concatenated HTTP/1.1 requests with typical browser headers, collecting method, path and headers. |
| Message translation (`message-translation`) | 4 | yes | Load a catalog of 5,000 messages in two locales and perform 100,000 lookups with interpolation and pluralization. |
| Dynamic attribute objects (`dynamic-attribute-objects`) | 4 | yes | Wrap a fixed nested document of 1,000 keys and perform 100,000 attribute reads and writes at varying depths. |
| File system watching (`file-watching`) | 4 | yes | Watch a directory tree of 1,000 files, apply a fixed script of 10,000 creates, writes and removes, and collect every resulting event. |
| Generated API and schema types (`generated-api-types`) | 4 | no |  |
| Unique ID generation (`id-generation`) | 3 | yes | Generate one million random unique IDs using the package's default secure generator. |
| Platform-specific binaries (`platform-binaries`) | 3 | no |  |
| HTML entity escaping (`html-escaping`) | 3 | yes | Escape the five HTML special characters in 100,000 short strings of mixed text and markup. |
| URL and URI parsing (`url-parsing`) | 3 | yes | Parse a fixed list of 100,000 absolute URLs into components and serialize them back. |
| JWT signing and verification (`jwt-signing`) | 3 | yes | Sign a fixed claims payload with HS256 and verify the resulting compact token, 10,000 times. |
| Markdown rendering (`markdown-parsing`) | 3 | yes | Render a fixed corpus of Markdown documents totalling several megabytes to HTML. |
| JSON path queries (`json-path-query`) | 3 | yes | Compile a fixed set of path expressions and evaluate each against a 1 MB nested document. |
| Typed object mapping (`typed-object-mapping`) | 3 | yes | Build 100,000 nested record objects from plain dictionaries and convert them back to dictionaries. |
| Background job queues (`background-job-queues`) | 3 | yes | Against a local backend, enqueue 10,000 no-op jobs with small arguments and run a worker until the queue is drained. |
| Redis clients (`redis-client`) | 3 | yes | Against a local Redis server, run 100,000 SET and GET commands, both one at a time and in pipelines of 100. |
| Ruby parsing (`ruby-parsing`) | 3 | yes | Parse a fixed corpus of large Ruby source files into a syntax tree. |
| User-agent parsing (`user-agent-parsing`) | 3 | yes | Parse a fixed list of 10,000 real-world User-Agent strings and read the browser name, version and platform of each. |
| Wrapping, slicing and stripping styled terminal text (`ansi-text-layout`) | 3 | yes | Take 10,000 lines of 200 visible columns with ANSI color codes every few words, strip the escape codes from each line and word-wrap each line to 80 columns, each member running the operations it offers. |
| Edit distance and string similarity (`edit-distance`) | 3 | yes | Compute the Levenshtein distance for 100,000 fixed pairs of strings of 5 to 200 characters. |
| Property list parsing (`plist-parsing`) | 3 | yes | Parse and re-serialize 1,000 property lists of 10,000 nested entries each. |
| Unicode normalization (`unicode-normalization`) | 3 | yes | Normalize a 50 MB multilingual corpus to each of NFC, NFD, NFKC and NFKD. |
| SSH and SFTP clients (`ssh-client`) | 3 | yes | Against a local SSH server, run 1,000 short commands over one connection and transfer a 100 MB file there and back over SFTP. |
| XML building (`xml-building`) | 3 | yes | Build and serialize a document of 1,000,000 elements, each with 3 attributes and a text node. |
| Config format parsing (`config-format-parsing`) | 2 | yes | Parse the same large nested configuration document, expressed in the subset every member accepts, into a plain object. |
| CSS stylesheet parsing (`css-parsing`) | 2 | yes | Parse one large real-world stylesheet (for example a CSS framework build) into the package's AST. |
| Value inspection and formatting (`value-inspection`) | 2 | yes | Format a fixed set of nested objects, arrays, Maps, Sets and primitives into strings. |
| HTTP server routing (`http-server-routing`) | 2 | yes | Register 100 parameterized routes with two middleware and dispatch a fixed mix of requests to handlers that return JSON. |
| Hash maps (`hash-maps`) | 2 | yes | Insert 1,000,000 integer and string keys, look each up, iterate, then remove half. |
| TOML parsing (`toml-parsing`) | 2 | yes | Parse a fixed corpus of TOML documents, including a 5,000-line lockfile. |
| Authenticated encryption (`authenticated-encryption`) | 2 | yes | Seal and open a 16 MB buffer and 100,000 1 KB messages with one key. |
| Text diffing (`text-diff`) | 2 | yes | Diff pairs of 10,000-line text files that differ by 1%, 10% and 50% of their lines. |
| Identifier case conversion (`case-conversion`) | 2 | yes | Convert 1,000,000 mixed identifiers to snake, camel and kebab case. |
| Character encoding detection (`charset-detection`) | 2 | yes | Detect the encoding of a fixed corpus of 1,000 text files in assorted legacy and Unicode encodings. |
| File type detection (`file-type-detection`) | 2 | yes | Identify the type of each of 10,000 buffers holding the first bytes of files in 50 common formats. |
| Password hashing (`password-hashing`) | 2 | yes | Hash and verify 100 passwords at fixed, equivalent cost parameters. |
| Sorted maps and prefix trees (`sorted-maps`) | 2 | yes | Insert 1,000,000 string keys, look each up, then run a fixed set of range and prefix scans in key order. |
| QR code generation (`qr-code-generation`) | 2 | yes | Encode a fixed set of URLs and text payloads at a given error-correction level and produce the module matrix or SVG for each. |
| MIME type lookup (`mime-type-lookup`) | 2 | yes | Look up the media type for 100,000 file names drawn from 500 distinct extensions, then the default extension for 10,000 media types. |
| Public suffix lookup (`public-suffix-lookup`) | 2 | yes | Split 100,000 host names covering 1,000 distinct suffixes into their registrable domain and public suffix. |
| Layered configuration loading (`layered-configuration`) | 2 | yes | Load a 1,000-key configuration from two files plus 100 environment overrides and read every key 100 times. |
| Terminal progress bars and spinners (`terminal-progress-bars`) | 2 | yes | Advance a progress bar 1,000,000 times toward a fixed total while it renders to an in-memory, non-interactive stream. |
| Syntax highlighting (`syntax-highlighting`) | 2 | yes | Highlight a 1 MB source file to HTML, 10 times over. |
| Spreadsheet file reading (`spreadsheet-reading`) | 2 | yes | Open a 20 MB workbook of 5 sheets with 100,000 rows of 10 columns each and read every cell value. |
| ASCII transliteration and slugs (`ascii-transliteration`) | 2 | yes | Transliterate 100,000 titles of 80 characters in 20 scripts to ASCII. |
| SMTP clients (`smtp-client`) | 2 | yes | Send 10,000 messages of 10 KB each to a local SMTP sink over one connection. |
| Fake data generation (`fake-data-generation`) | 2 | yes | With a fixed seed, generate 1,000,000 records of name, email, street address and date. |
| File existence lookup (`file-lookup`) | 1 | yes | From a deep directory in a fixture tree, locate the nearest existing marker file among candidates in each ancestor directory. |
| Object merging (`object-merging`) | 1 | yes | Merge a fixed sequence of nested plain option objects into one result object, 100,000 times. |
| Event emitters (`event-emitter`) | 1 | yes | Register 10 listeners on each of several event names and emit one million events with two arguments. |
| Tar archiving (`tar-archiving`) | 1 | yes | Pack a fixture directory of 1,000 small files into a tar archive and extract it again. |
| Arbitrary-precision arithmetic (`arbitrary-precision-math`) | 1 | yes | Compute the factorial of 1,000 by repeated multiplication and convert the result to a decimal string. |
| Terminal string width (`terminal-string-width`) | 1 | yes | Compute the display width of 100,000 strings mixing ASCII, CJK and emoji characters. |
| LRU caches (`lru-cache`) | 1 | yes | Replay a fixed Zipf-distributed trace of 1,000,000 get/set operations against a cache capped at 10,000 entries. |
| Non-cryptographic hashing (`non-cryptographic-hashing`) | 1 | yes | Hash 1,000,000 short keys and one 64 MB buffer to a 64-bit value. |
| Checksums (`checksums`) | 1 | yes | Checksum a 64 MB buffer in one call and again in 4 KB incremental updates. |
| Base64 encoding (`base64-encoding`) | 1 | yes | Encode and decode a 16 MB buffer and 100,000 32-byte values with the standard alphabet. |
| Digital signatures (`digital-signatures`) | 1 | yes | Generate a key pair, then sign and verify 10,000 short messages. |
| PDF reading (`pdf-text-extraction`) | 1 | yes | Extract the text of every page from a fixed set of PDF documents totalling 1,000 pages. |
| Text table rendering (`text-table-rendering`) | 1 | yes | Render a table of 10,000 rows and 8 mixed-type columns to a string. |
| Retry policies (`retry-policies`) | 1 | yes | Wrap a function that fails a fixed number of times before succeeding and call it 100,000 times with zero delay. |
| PostgreSQL clients (`postgres-client`) | 1 | yes | Against a local PostgreSQL server, insert 100,000 rows with a prepared statement and read them back. |
| MySQL clients (`mysql-client`) | 1 | yes | Against a local MySQL server, insert 100,000 rows with a prepared statement and read them back. |
| Dotenv loading (`dotenv-loading`) | 1 | yes | Parse the same .env text of 1,000 assignments with quotes, comments and variable references into a key-value map. |
| Semantic version comparison (`semver-comparison`) | 1 | yes | Parse a fixed list of 10,000 version strings, sort them, and test each against a fixed set of range constraints. |
| Metrics instrumentation (`metrics-instrumentation`) | 1 | yes | Register 100 labelled counters, gauges and histograms, apply 10,000,000 updates from several threads, then render one text snapshot of the registry. |
| MongoDB clients (`mongodb-client`) | 1 | yes | Against a local server, insert 10,000 documents into a collection and read them back with a query that returns ten fields each. |
| ZIP archiving (`zip-archiving`) | 1 | yes | Pack a fixed set of in-memory files into a deflate-compressed ZIP archive, then list and extract every entry from it. |
| Cron expression scheduling (`cron-scheduling`) | 1 | yes | Parse a fixed set of cron expressions and compute the next 1,000 occurrence times of each from a fixed start date. |
| Dependency injection containers (`dependency-injection`) | 1 | yes | Register a fixed graph of a few hundred interdependent services with singleton and transient lifetimes, then resolve the root services repeatedly. |
| HTTP cookie parsing (`cookie-parsing`) | 1 | yes | Parse 100,000 Cookie headers of 10 pairs each and 100,000 Set-Cookie headers with attributes, then serialize them back to strings. |
| IP address and CIDR parsing (`ip-address-parsing`) | 1 | yes | Parse 100,000 IPv4 and IPv6 address strings and test each against 100 CIDR ranges. |
| IDNA and Punycode conversion (`idna-punycode`) | 1 | yes | Convert 100,000 Unicode domain names to ASCII and back to Unicode. |
| Atomic file writing (`atomic-file-writing`) | 1 | yes | Atomically replace 1,000 files of 64 KiB each, 10 times over. |
| SQL parsing (`sql-parsing`) | 1 | yes | Parse 10,000 fixed SELECT, INSERT, UPDATE and CREATE TABLE statements of 100 to 2,000 characters. |
| GraphQL execution (`graphql-execution`) | 1 | yes | Against a schema of 50 types, parse, validate and execute 10,000 queries that each resolve about 100 fields from in-memory data. |
| CSV parsing (`csv-parsing`) | 1 | yes | Parse a 100 MB CSV file of 1,000,000 rows and 10 columns, a quarter of the fields quoted, and write the rows back out. |
| Spreadsheet file writing (`spreadsheet-writing`) | 1 | yes | Write a workbook of 5 sheets with 100,000 rows of 10 mixed numeric and string columns each. |
| HTML to Markdown conversion (`html-to-markdown`) | 1 | yes | Convert 1,000 HTML documents of 50 KB each, with headings, lists, links, tables and code blocks, to Markdown. |
| JSON Patch (`json-patch`) | 1 | yes | Apply 100,000 patches of 10 operations each to a 100 KB JSON document. |
| Character set transcoding (`charset-transcoding`) | 1 | yes | Decode 10 MB of text in each of Shift_JIS, GBK and windows-1252 to Unicode and encode it back. |
| Natural sort order (`natural-sorting`) | 1 | yes | Sort 1,000,000 strings that mix letters and digit runs into natural order. |
| Unauthenticated symmetric ciphers (`symmetric-ciphers`) | 1 | yes | Encrypt and decrypt a 100 MB buffer and 1,000,000 buffers of 64 bytes with a fixed key and nonce. |
| One-time passwords (`one-time-passwords`) | 1 | yes | Generate 1,000,000 TOTP codes for fixed secrets and timestamps and verify each with a window of one step. |
| Linear algebra and arrays (`linear-algebra`) | 1 | yes | Multiply two 1,000 by 1,000 matrices of 64-bit floats and multiply 10,000,000 pairs of 4 by 4 matrices. |
| Graph algorithms (`graph-algorithms`) | 1 | yes | Build a directed acyclic graph of 100,000 nodes and 500,000 edges, topologically sort it and find its strongly connected components. |
| Synchronization primitives (`synchronization-primitives`) | 1 | yes | Have 8 threads each lock and unlock one shared mutex around a counter increment 1,000,000 times. |
| Resource pools (`resource-pools`) | 1 | yes | From a pool of 10 resources, check out and return a resource 1,000,000 times across 32 concurrent callers. |
| Kafka clients (`kafka-client`) | 1 | yes | Against a local single-node broker, produce 1,000,000 records of 1 KB to one topic and consume them all back. |
| SQLite clients (`sqlite-client`) | 1 | yes | In an in-memory database, insert 1,000,000 rows of 5 columns in one transaction and select them all back. |
| Git repository access (`git-repository-access`) | 1 | yes | In a repository of 10,000 commits and 5,000 files, walk the full history and read every blob of the head tree. |
| SOCKS proxy clients (`socks-proxy-client`) | 1 | yes | Open 10,000 connections through a local SOCKS5 proxy to a local echo server and send 1 KB over each. |

## Service SDKs and telemetry

Client SDKs, credential providers, middleware and instrumentation tied to one vendor or protocol stack, such as AWS, Google Cloud, OpenTelemetry and Sentry.

- `aws-sdk-core` #2, 1.8B in total
- `aws-sigv4` #3, 1.6B in total
- `aws-partitions` #4, 1.5B in total
- `aws-eventstream` #11, 1.4B in total
- `aws-sdk-s3` #26, 1.1B in total
- `aws-sdk-kms` #28, 1.1B in total
- `googleauth` #95, 516M in total
- `signet` #100, 504M in total (low confidence: OAuth client implementation)
- `octokit` #131, 396M in total
- `aws-sdk` #137, 384M in total
- `aws-sdk-resources` #143, 367M in total
- `aws-sdk-sqs` #152, 347M in total
- `google-apis-core` #189, 290M in total
- `google-cloud-core` #193, 286M in total
- `aws-sdk-ssm` #195, 281M in total
- `google-cloud-errors` #205, 273M in total
- `aws-sdk-ec2` #208, 266M in total
- `google-cloud-storage` #227, 243M in total
- `aws-sdk-kinesis` #244, 224M in total
- `elasticsearch-api` #248, 219M in total
- `elasticsearch` #250, 218M in total
- `aws-sdk-dynamodb` #257, 213M in total
- `google-apis-storage_v1` #265, 209M in total
- `grpc` #267, 209M in total (low confidence: gRPC runtime; no RPC category)
- `google-apis-iamcredentials_v1` #277, 203M in total
- `fog-core` #286, 197M in total
- `newrelic_rpm` #291, 187M in total
- `google-api-client` #295, 186M in total
- `fog-aws` #310, 177M in total
- `aws-sdk-sns` #311, 177M in total
- `elasticsearch-transport` #313, 175M in total
- `aws-sdk-cloudwatch` #318, 171M in total
- `aws-sdk-cloudformation` #319, 170M in total
- `aws-sdk-lambda` #320, 170M in total
- `aws-sdk-secretsmanager` #321, 170M in total
- `google-apis-androidpublisher_v3` #341, 159M in total
- `aws-sdk-iam` #346, 154M in total
- `sentry-ruby` #348, 153M in total
- `aws-sdk-ecr` #355, 147M in total
- `aws-sdk-cloudwatchlogs` #358, 146M in total
- `slack-notifier` #373, 141M in total
- `aws-sdk-route53` #380, 140M in total
- `dogstatsd-ruby` #385, 138M in total
- `twilio-ruby` #397, 136M in total
- `aws-sdk-ses` #412, 132M in total
- `aws-sdk-firehose` #423, 129M in total
- `aws-sdk-elasticloadbalancing` #425, 128M in total
- `stripe` #443, 123M in total
- `statsd-ruby` #453, 123M in total
- `sentry-rails` #454, 122M in total
- `aws-sdk-rds` #455, 122M in total
- `aws-sdk-cloudfront` #457, 121M in total
- `google-apis-playcustomapp_v1` #458, 121M in total
- `artifactory` #460, 120M in total
- `gitlab` #472, 116M in total
- `aws-sdk-states` #476, 115M in total
- `aws-sdk-cloudwatchevents` #480, 114M in total
- `aws-sdk-codecommit` #481, 114M in total
- `dogapi` #482, 114M in total
- `aws-sdk-autoscaling` #484, 113M in total
- `aws-sdk-ecs` #486, 113M in total
- `sentry-raven` #487, 113M in total
- `aws-sdk-elasticloadbalancingv2` #519, 105M in total
- `aws-sdk-cognitoidentityprovider` #533, 102M in total
- `aws-sdk-athena` #536, 101M in total
- `ddtrace` #537, 100M in total
- `aws-sdk-rekognition` #541, 100M in total
- `aws-sdk-configservice` #549, 98M in total
- `algoliasearch` #551, 98M in total
- `aws-sdk-apigateway` #553, 98M in total
- `aws-sdk-redshift` #555, 98M in total
- `aws-sdk-glue` #556, 98M in total
- `aws-sdk-elasticache` #558, 97M in total
- `docker-api` #560, 97M in total
- `aws-sdk-elasticsearchservice` #569, 96M in total
- `aws-sdk-acm` #572, 95M in total
- `aws-sdk-batch` #573, 95M in total
- `aws-sdk-pinpoint` #574, 95M in total
- `aws-sdk-cloudtrail` #576, 95M in total
- `aws-sdk-mediaconvert` #577, 95M in total
- `aws-sdk-organizations` #578, 95M in total
- `aws-sdk-emr` #584, 94M in total
- `aws-sdk-codedeploy` #585, 94M in total
- `aws-sdk-xray` #586, 94M in total
- `aws-sdk-databasemigrationservice` #587, 94M in total
- `aws-sdk-efs` #588, 94M in total
- `aws-sdk-sagemaker` #589, 94M in total
- `aws-sdk-applicationautoscaling` #590, 94M in total
- `aws-sdk-dynamodbstreams` #591, 94M in total
- `aws-sdk-codebuild` #593, 93M in total
- `aws-sdk-elasticbeanstalk` #595, 93M in total
- `slack-ruby-client` #597, 93M in total
- `aws-sdk-iot` #599, 93M in total
- `aws-sdk-cloudhsmv2` #600, 92M in total
- `aws-sdk-codepipeline` #601, 92M in total
- `aws-sdk-servicecatalog` #602, 92M in total
- `aws-sdk-polly` #606, 92M in total
- `aws-sdk-cognitoidentity` #608, 92M in total
- `aws-sdk-lightsail` #609, 91M in total
- `aws-sdk-budgets` #610, 91M in total
- `aws-sdk-route53domains` #611, 91M in total
- `recaptcha` #612, 91M in total
- `aws-sdk-waf` #613, 91M in total
- `aws-sdk-workspaces` #614, 91M in total
- `aws-sdk-costandusagereportservice` #618, 91M in total
- `aws-sdk-shield` #619, 90M in total
- `fog-google` #621, 90M in total
- `aws-sdk-cloudhsm` #623, 90M in total
- `aws-sdk-applicationdiscoveryservice` #624, 90M in total
- `aws-sdk-guardduty` #625, 90M in total
- `aws-sdk-comprehend` #626, 90M in total
- `aws-sdk-directconnect` #628, 90M in total
- `aws-sdk-directoryservice` #629, 90M in total
- `aws-sdk-gamelift` #630, 90M in total
- `aws-sdk-storagegateway` #631, 90M in total
- `aws-sdk-resourcegroupstaggingapi` #632, 89M in total
- `aws-sdk-appstream` #633, 89M in total
- `aws-sdk-cloudsearch` #634, 89M in total
- `aws-sdk-devicefarm` #635, 89M in total
- `aws-sdk-sagemakerruntime` #636, 89M in total
- `aws-sdk-costexplorer` #637, 89M in total
- `aws-sdk-transcribeservice` #639, 89M in total
- `aws-sdk-medialive` #640, 89M in total
- `aws-sdk-opsworks` #641, 89M in total
- `aws-sdk-sms` #642, 89M in total
- `aws-sdk-lex` #643, 89M in total
- `aws-sdk-glacier` #645, 89M in total
- `aws-sdk-dax` #646, 89M in total
- `aws-sdk-simpledb` #647, 89M in total
- `aws-sdk-marketplacemetering` #649, 89M in total
- `aws-sdk-greengrass` #650, 89M in total
- `aws-sdk-health` #651, 88M in total
- `aws-sdk-lexmodelbuildingservice` #652, 88M in total
- `aws-sdk-iotdataplane` #653, 88M in total
- `aws-sdk-snowball` #654, 88M in total
- `aws-sdk-swf` #656, 88M in total
- `aws-sdk-migrationhub` #657, 88M in total
- `aws-sdk-machinelearning` #660, 88M in total
- `aws-sdk-cloudsearchdomain` #661, 88M in total
- `aws-sdk-elastictranscoder` #663, 88M in total
- `aws-sdk-translate` #664, 88M in total
- `aws-sdk-marketplacecommerceanalytics` #665, 88M in total
- `aws-sdk-wafregional` #666, 88M in total
- `aws-sdk-inspector` #667, 88M in total
- `aws-sdk-eks` #668, 88M in total
- `aws-sdk-support` #669, 88M in total
- `aws-sdk-workdocs` #671, 87M in total
- `aws-sdk-mturk` #672, 87M in total
- `aws-sdk-clouddirectory` #673, 87M in total
- `aws-sdk-marketplaceentitlementservice` #674, 87M in total
- `aws-sdk-kinesisanalytics` #676, 87M in total
- `aws-sdk-datapipeline` #677, 87M in total
- `aws-sdk-cognitosync` #678, 87M in total
- `aws-sdk-connect` #679, 87M in total
- `aws-sdk-appsync` #680, 87M in total
- `aws-sdk-importexport` #682, 87M in total
- `aws-sdk-mq` #683, 87M in total
- `aws-sdk-mediapackage` #687, 87M in total
- `sentry-sidekiq` #689, 87M in total
- `aws-sdk-opsworkscm` #692, 86M in total
- `aws-sdk-kinesisvideo` #697, 86M in total
- `aws-sdk-servicediscovery` #698, 86M in total
- `aws-sdk-pricing` #699, 86M in total
- `aws-sdk-resourcegroups` #700, 86M in total
- `aws-sdk-workmail` #701, 85M in total
- `libdatadog` #702, 85M in total
- `aws-sdk-mediastore` #703, 85M in total
- `aws-sdk-kinesisvideoarchivedmedia` #704, 85M in total
- `aws-sdk-serverlessapplicationrepository` #705, 85M in total
- `aws-sdk-cloud9` #706, 85M in total
- `aws-sdk-acmpca` #710, 84M in total
- `aws-sdk-iotjobsdataplane` #712, 84M in total
- `aws-sdk-mediastoredata` #713, 84M in total
- `aws-sdk-kinesisvideomedia` #714, 84M in total
- `aws-sdk-autoscalingplans` #715, 84M in total
- `aws-sdk-fms` #720, 83M in total
- `aws-sdk-neptune` #730, 81M in total
- `gapic-common` #734, 80M in total
- `aws-sdk-lambdapreview` #735, 80M in total
- `aws-sdk-mediatailor` #736, 80M in total
- `aws-sdk-codestar` #737, 80M in total
- `aws-sdk-pi` #743, 80M in total
- `aws-sdk-dlm` #744, 79M in total
- `aws-sdk-iotanalytics` #745, 79M in total
- `aws-sdk-alexaforbusiness` #746, 79M in total
- `aws-sdk-mobile` #747, 79M in total
- `aws-sdk-kafka` #749, 78M in total
- `aws-sdk-transfer` #751, 78M in total
- `aws-sdk-s3control` #752, 78M in total
- `aws-sigv2` #753, 78M in total
- `openid_connect` #755, 78M in total (low confidence: OpenID Connect client/server library)
- `opentelemetry-api` #756, 78M in total
- `aws-sdk-quicksight` #757, 77M in total
- `rollbar` #763, 77M in total
- `aws-sdk-securityhub` #765, 77M in total
- `aws-sdk-signer` #769, 76M in total
- `aws-sdk-route53resolver` #773, 75M in total
- `aws-sdk-ram` #776, 75M in total
- `aws-sdk-chime` #777, 75M in total
- `aws-sdk-iot1clickprojects` #789, 73M in total
- `aws-sdk-iot1clickdevicesservice` #790, 73M in total
- `aws-sdk-datasync` #791, 73M in total
- `aws-sdk-amplify` #792, 73M in total
- `aws-sdk-fsx` #793, 73M in total
- `aws-sdk-rdsdataservice` #796, 73M in total
- `aws-sdk-apigatewayv2` #799, 73M in total
- `aws-sdk-appmesh` #806, 72M in total
- `aws-sdk-globalaccelerator` #808, 72M in total
- `aws-sdk-pinpointsmsvoice` #812, 71M in total
- `aws-sdk-pinpointemail` #814, 71M in total
- `aws-sdk-textract` #815, 71M in total
- `aws-sdk-licensemanager` #817, 71M in total
- `aws-sdk-mediaconnect` #818, 71M in total
- `aws-sdk-kinesisanalyticsv2` #819, 71M in total
- `aws-sdk-comprehendmedical` #820, 71M in total
- `aws-sdk-backup` #824, 70M in total
- `aws-sdk-docdb` #826, 70M in total
- `aws-sdk-robomaker` #829, 69M in total
- `aws-sdk-apigatewaymanagementapi` #831, 69M in total
- `bugsnag` #835, 68M in total
- `aws-sdk-sesv2` #836, 68M in total
- `aws-sdk-macie` #845, 66M in total
- `aws-sdk-eventbridge` #846, 66M in total
- `aws-sdk-transcribestreamingservice` #855, 65M in total
- `jira-ruby` #858, 65M in total
- `aws-sdk-personalize` #869, 63M in total
- `opentelemetry-sdk` #873, 63M in total
- `fog-aliyun` #874, 63M in total
- `aws-sdk-mediapackagevod` #875, 63M in total
- `aws-sdk-managedblockchain` #876, 63M in total
- `sendgrid-ruby` #877, 62M in total
- `aws-sdk-personalizeruntime` #879, 62M in total
- `opentracing` #880, 62M in total
- `opentelemetry-common` #886, 61M in total
- `aws-sdk-ioteventsdata` #887, 61M in total
- `aws-sdk-iotevents` #888, 61M in total
- `aws-sdk-groundstation` #889, 61M in total
- `aws-sdk-iotthingsgraph` #891, 61M in total
- `aws-sdk-ec2instanceconnect` #892, 61M in total
- `aws-sdk-personalizeevents` #893, 60M in total
- `aws-sdk-applicationinsights` #894, 60M in total
- `aws-sdk-worklink` #896, 60M in total
- `aws-sdk-v1` #897, 60M in total
- `vault` #900, 60M in total
- `fog` #902, 60M in total
- `aws-sdk-forecastservice` #904, 60M in total
- `opentelemetry-semantic_conventions` #910, 59M in total
- `aws-sdk-servicequotas` #911, 59M in total
- `aws-sdk-lakeformation` #913, 59M in total
- `restforce` #918, 58M in total
- `opensearch-ruby` #921, 58M in total
- `aws-sdk-appconfig` #925, 57M in total
- `aws-sdk-forecastqueryservice` #927, 57M in total
- `aws-sdk-wafv2` #931, 57M in total
- `aws-sdk-workmailmessageflow` #940, 56M in total
- `aws-sdk-networkmanager` #941, 56M in total
- `gems` #945, 56M in total
- `aws-sdk-kendra` #946, 56M in total
- `aws-sdk-accessanalyzer` #948, 55M in total
- `opentelemetry-registry` #951, 55M in total
- `aws-sdk-marketplacecatalog` #952, 55M in total
- `aws-sdk-qldbsession` #955, 55M in total
- `aws-sdk-frauddetector` #957, 55M in total
- `aws-sdk-qldb` #959, 55M in total
- `aws-sdk-codestarnotifications` #960, 55M in total
- `aws-sdk-outposts` #961, 54M in total
- `aws-sdk-savingsplans` #966, 54M in total
- `aws-sdk-dataexchange` #973, 54M in total
- `aws-sdk-computeoptimizer` #976, 54M in total
- `aws-sdk-detective` #977, 54M in total
- `aws-sdk-imagebuilder` #980, 54M in total
- `aws-sdk-codegurureviewer` #981, 53M in total
- `aws-sdk-augmentedairuntime` #983, 53M in total
- `aws-sdk-connectparticipant` #986, 53M in total
- `aws-sdk-iotsecuretunneling` #988, 53M in total
- `aws-sdk-migrationhubconfig` #990, 53M in total
- `aws-sdk-ebs` #991, 53M in total
- `aws-sdk-codeguruprofiler` #992, 53M in total
- `aws-sdk-schemas` #993, 53M in total
- `aws-sdk-kinesisvideosignalingchannels` #999, 52M in total

## Framework and tool extensions

Plugins, engines, adapters, middleware and asset bundles that only work inside one host framework or tool, such as Rails engines, Rack middleware, OmniAuth strategies, Faraday adapters and Fluentd or Logstash plugins; the host frameworks themselves and build or test tooling plugins are out of scope.

- `multipart-post` #33, 931M in total (low confidence: accessory for Net::HTTP)
- `faraday-net_http` #52, 761M in total
- `globalid` #69, 672M in total
- `sprockets-rails` #85, 566M in total
- `rack-protection` #93, 522M in total
- `faraday_middleware` #112, 466M in total (low confidence)
- `actiontext` #114, 453M in total
- `actionmailbox` #115, 453M in total
- `faraday-retry` #121, 418M in total
- `rspec-rails` #124, 412M in total
- `faraday-multipart` #128, 403M in total
- `faraday-excon` #129, 403M in total
- `faraday-net_http_persistent` #130, 398M in total
- `faraday-em_synchrony` #144, 364M in total
- `faraday-em_http` #151, 353M in total
- `faraday-httpclient` #157, 341M in total
- `responders` #159, 338M in total
- `faraday-patron` #160, 337M in total
- `rubocop-performance` #162, 333M in total
- `faraday-rack` #164, 331M in total
- `rubocop-rails` #172, 312M in total
- `warden` #175, 309M in total
- `rubocop-rspec` #182, 299M in total
- `devise` #183, 298M in total (low confidence: authentication framework)
- `factory_bot_rails` #185, 297M in total
- `sass-rails` #186, 296M in total
- `rack-cors` #199, 278M in total
- `kaminari` #203, 275M in total
- `kaminari-activerecord` #231, 238M in total
- `coffee-rails` #233, 237M in total
- `kaminari-actionview` #234, 237M in total
- `pry-rails` #239, 231M in total
- `omniauth` #243, 227M in total (low confidence: Rack authentication framework; host-specific)
- `rack-session` #268, 208M in total
- `dotenv-rails` #270, 207M in total
- `lograge` #279, 203M in total
- `omniauth-oauth2` #290, 190M in total
- `web-console` #293, 187M in total
- `bullet` #294, 186M in total
- `uniform_notifier` #298, 185M in total
- `fog-xml` #301, 183M in total (low confidence: shared XML helpers of fog providers)
- `rack-proxy` #306, 181M in total
- `sassc-rails` #312, 177M in total
- `kramdown-parser-gfm` #314, 175M in total
- `faraday-cookie_jar` #322, 169M in total
- `activerecord-import` #325, 168M in total
- `fluent-plugin-s3` #336, 161M in total
- `fluent-plugin-kubernetes_metadata_filter` #337, 161M in total
- `rack-attack` #345, 154M in total
- `paper_trail` #353, 149M in total
- `carrierwave` #361, 145M in total
- `turbolinks` #365, 144M in total
- `rails-i18n` #370, 143M in total
- `faraday-http-cache` #372, 142M in total
- `redis-store` #393, 137M in total
- `spring-commands-rspec` #395, 136M in total
- `guard-compat` #398, 136M in total
- `celluloid-io` #408, 133M in total (low confidence: Celluloid add-on)
- `redis-rack` #424, 129M in total
- `redis-actionpack` #429, 127M in total
- `raindrops` #436, 125M in total (low confidence: Rack server stats toolkit)
- `omniauth-google-oauth2` #437, 125M in total
- `faraday_middleware-aws-sigv4` #447, 123M in total
- `letter_opener` #456, 121M in total
- `ransack` #464, 119M in total
- `claide-plugins` #468, 117M in total
- `doorkeeper` #474, 116M in total
- `rack-timeout` #489, 112M in total
- `premailer-rails` #491, 112M in total
- `pundit` #493, 112M in total
- `better_errors` #497, 111M in total
- `will_paginate` #506, 109M in total
- `fluent-plugin-record-modifier` #512, 105M in total
- `turbolinks-source` #515, 105M in total
- `cocoapods-trunk` #525, 104M in total
- `simple_form` #545, 99M in total
- `cocoapods-deintegrate` #548, 99M in total
- `cocoapods-try` #552, 98M in total
- `sidekiq-cron` #554, 98M in total
- `cocoapods-search` #561, 97M in total
- `activemodel-serializers-xml` #562, 97M in total
- `webpacker` #565, 96M in total
- `cancancan` #567, 96M in total
- `cocoapods-plugins` #570, 95M in total
- `fluent-plugin-elasticsearch` #579, 95M in total
- `redis-activesupport` #580, 95M in total
- `jquery-ui-rails` #603, 92M in total
- `activeresource` #615, 91M in total
- `annotate` #622, 90M in total
- `fog-local` #644, 89M in total (low confidence: Fog storage provider adapter)
- `validate_url` #655, 88M in total
- `turbo-rails` #662, 88M in total
- `rack-mini-profiler` #670, 88M in total
- `spring-watcher-listen` #685, 87M in total
- `redis-rails` #688, 87M in total
- `strong_migrations` #707, 85M in total
- `rack-oauth2` #711, 84M in total (low confidence: Rack-based OAuth2 server/client; no fitting peer)
- `rack-accept` #716, 84M in total (low confidence: Rack Accept header handling)
- `paranoia` #717, 83M in total
- `paperclip` #724, 82M in total
- `attr_encrypted` #729, 81M in total
- `logstash-filter-translate` #731, 81M in total
- `logstash-output-sqs` #739, 80M in total
- `elasticsearch-model` #758, 77M in total
- `bootstrap-sass` #759, 77M in total
- `faraday-follow_redirects` #761, 77M in total
- `omniauth-rails_csrf_protection` #762, 77M in total
- `mustermann-grape` #764, 77M in total
- `fluent-plugin-rewrite-tag-filter` #770, 76M in total
- `acts_as_list` #774, 75M in total
- `marginalia` #786, 74M in total
- `stimulus-rails` #787, 74M in total
- `has_scope` #805, 72M in total
- `acts-as-taggable-on` #816, 71M in total
- `flipper-active_record` #825, 70M in total
- `state_machines-activemodel` #827, 69M in total
- `omniauth-facebook` #834, 68M in total
- `elasticsearch-rails` #837, 67M in total
- `state_machines-activerecord` #839, 67M in total
- `fluent-config-regexp-type` #843, 67M in total
- `omniauth-saml` #844, 66M in total
- `gon` #853, 65M in total
- `font-awesome-rails` #859, 65M in total
- `formtastic` #860, 64M in total
- `view_component` #862, 64M in total
- `graphiql-rails` #863, 64M in total
- `logstash-output-statsd` #870, 63M in total
- `rack-cache` #872, 63M in total
- `draper` #878, 62M in total
- `importmap-rails` #881, 62M in total
- `devise-two-factor` #884, 62M in total
- `delayed_job_active_record` #890, 61M in total
- `friendly_id` #898, 60M in total
- `inherited_resources` #906, 60M in total
- `haml-rails` #909, 59M in total
- `health_check` #917, 58M in total
- `fluent-plugin-grafana-loki` #935, 56M in total
- `money-rails` #942, 56M in total
- `fastlane-plugin-firebase_app_distribution` #943, 56M in total
- `validate_email` #962, 54M in total
- `factory_girl_rails` #969, 54M in total
- `capistrano-bundler` #971, 54M in total
- `fluent-plugin-ignore-filter` #972, 54M in total
- `fluent-plugin-prometheus` #978, 54M in total
- `rswag-ui` #989, 53M in total
- `omniauth-github` #995, 52M in total
- `pg_search` #997, 52M in total
- `better_html` #998, 52M in total

## Build, lint and test tooling

Compilers, bundlers, transformers, linters, test runners and their plugins and configs, which run at development time rather than performing one comparable runtime task.

- `bundler` #1, 3.8B in total (low confidence: dependency manager CLI, not a runtime task)
- `rake` #8, 1.4B in total
- `minitest` #14, 1.3B in total
- `rspec-core` #20, 1.2B in total
- `rspec-expectations` #21, 1.2B in total
- `rspec-mocks` #22, 1.2B in total
- `rspec-support` #23, 1.2B in total
- `rspec` #29, 1.0B in total
- `rack-test` #42, 819M in total
- `rubocop` #55, 755M in total
- `rails-dom-testing` #66, 690M in total
- `pry` #72, 638M in total (low confidence: developer REPL)
- `sprockets` #74, 625M in total
- `rubygems-update` #75, 624M in total (low confidence: updater for RubyGems package manager)
- `mini_portile2` #77, 615M in total
- `simplecov` #98, 506M in total
- `simplecov-html` #101, 496M in total
- `byebug` #108, 483M in total
- `webmock` #118, 428M in total
- `knapsack` #133, 389M in total
- `bootsnap` #138, 381M in total
- `sass` #142, 368M in total
- `capybara` #145, 361M in total
- `selenium-webdriver` #146, 360M in total
- `factory_bot` #148, 358M in total
- `rdoc` #150, 354M in total
- `uglifier` #187, 296M in total
- `pry-byebug` #191, 289M in total
- `shoulda-matchers` #200, 276M in total
- `rspec_junit_formatter` #201, 275M in total
- `simplecov_json_formatter` #202, 275M in total
- `timecop` #204, 274M in total
- `coffee-script-source` #207, 267M in total
- `spring` #210, 261M in total
- `coffee-script` #213, 258M in total
- `brakeman` #229, 239M in total
- `benchmark` #230, 239M in total (low confidence: benchmarking library; no benchmark-harness category)
- `yard` #232, 237M in total
- `database_cleaner` #247, 220M in total
- `fastlane` #253, 215M in total
- `sassc` #258, 213M in total
- `rails-controller-testing` #281, 201M in total
- `ffi-compiler` #303, 182M in total (low confidence: FFI build helper)
- `parallel_tests` #323, 169M in total
- `vcr` #327, 167M in total
- `autoprefixer-rails` #330, 165M in total (low confidence: CSS vendor prefixer wrapper)
- `stackprof` #340, 159M in total (low confidence: sampling profiler)
- `guard` #343, 156M in total
- `bundler-audit` #356, 147M in total
- `xcpretty` #357, 147M in total
- `climate_control` #364, 144M in total (low confidence: ENV modification for tests)
- `bootboot` #381, 140M in total
- `lint_roller` #389, 137M in total
- `database_cleaner-active_record` #403, 135M in total (low confidence: test DB cleaning plugin)
- `database_cleaner-core` #414, 131M in total (low confidence: test DB cleaning core)
- `guard-rspec` #418, 130M in total
- `xcpretty-travis-formatter` #422, 129M in total
- `danger` #427, 127M in total
- `rspec-retry` #428, 127M in total
- `debug` #431, 127M in total
- `rubygems-bundler` #477, 115M in total
- `capybara-screenshot` #500, 110M in total
- `cucumber` #521, 104M in total
- `rspec-its` #522, 104M in total
- `rubocop-capybara` #528, 103M in total
- `rubocop-factory_bot` #539, 100M in total
- `test-unit` #544, 99M in total
- `mocha` #550, 98M in total
- `multi_test` #592, 93M in total
- `benchmark-ips` #627, 90M in total (low confidence: Dev-time benchmarking tool)
- `cucumber-core` #638, 89M in total
- `power_assert` #659, 88M in total
- `webdrivers` #691, 87M in total
- `test-prof` #719, 83M in total
- `sdoc` #728, 81M in total
- `rspec-parameterized` #738, 80M in total
- `email_spec` #784, 74M in total
- `fuubar` #797, 73M in total
- `factory_girl` #804, 72M in total
- `simplecov-cobertura` #823, 70M in total
- `terser` #850, 66M in total
- `mini_portile` #851, 66M in total
- `rspec-sidekiq` #905, 60M in total
- `sorbet` #934, 56M in total
- `cucumber-wire` #938, 56M in total
- `minitest-reporters` #950, 55M in total
- `rspec-collection_matchers` #964, 54M in total
- `babel-transpiler` #965, 54M in total
- `derailed_benchmarks` #974, 54M in total
- `rubocop-rspec_rails` #984, 53M in total
- `shoulda-context` #987, 53M in total
- `standard` #1000, 52M in total

## Other (no peers yet)

Packages that are benchmarkable in principle but have no functionally equivalent peers in the list yet; revisit as the list grows.

- `tzinfo` #13, 1.3B in total (low confidence: time zone database package, excluded from date-time)
- `zeitwerk` #63, 710M in total
- `regexp_parser` #68, 676M in total
- `netrc` #86, 563M in total
- `execjs` #123, 417M in total
- `net-imap` #134, 386M in total
- `highline` #154, 344M in total
- `xpath` #155, 344M in total
- `eventmachine` #161, 334M in total
- `mustermann` #184, 297M in total
- `oauth2` #196, 279M in total
- `drb` #198, 279M in total
- `reline` #209, 262M in total
- `net-ntp` #218, 249M in total
- `net-pop` #220, 248M in total
- `tty-cursor` #236, 234M in total
- `xcodeproj` #242, 227M in total
- `fastimage` #255, 214M in total
- `redis-namespace` #256, 213M in total
- `ice_nine` #263, 210M in total
- `timers` #278, 203M in total
- `binding_of_caller` #280, 201M in total
- `stringio` #282, 200M in total
- `state_machines` #299, 184M in total
- `oauth` #317, 171M in total
- `celluloid` #326, 168M in total
- `bindex` #331, 165M in total
- `gh_inspector` #338, 159M in total
- `notiffany` #369, 143M in total
- `ruby-saml` #386, 138M in total
- `money` #402, 135M in total
- `dalli` #416, 131M in total
- `premailer` #426, 128M in total
- `prettyprint` #438, 125M in total
- `cork` #466, 118M in total
- `molinillo` #473, 116M in total
- `Ascii85` #479, 115M in total
- `cocoapods-downloader` #490, 112M in total
- `geocoder` #494, 111M in total
- `strscan` #501, 110M in total
- `ruby-macho` #503, 110M in total
- `memory_profiler` #504, 109M in total
- `aasm` #509, 107M in total
- `powerpack` #510, 107M in total
- `wasabi` #513, 105M in total
- `little-plugger` #514, 105M in total
- `akami` #526, 104M in total
- `ssrf_filter` #529, 103M in total
- `savon` #530, 102M in total
- `polyglot` #531, 102M in total
- `afm` #532, 102M in total
- `sshkit` #543, 100M in total
- `fourflusher` #559, 97M in total
- `flipper` #566, 96M in total
- `graphql-client` #571, 95M in total
- `require_all` #581, 94M in total
- `rubyntlm` #594, 93M in total (low confidence: NTLM message creator/parser; no peer category)
- `ruby-prof` #596, 93M in total
- `tty-reader` #604, 92M in total
- `tty-prompt` #605, 92M in total
- `cgi` #648, 89M in total (low confidence: CGI protocol support with assorted helpers; no clear single task)
- `net-ldap` #658, 88M in total
- `rbs` #684, 87M in total
- `ruby-ole` #686, 87M in total
- `whenever` #721, 82M in total (low confidence: generates crontab entries from Ruby DSL; does not compute run times)
- `icalendar` #725, 81M in total
- `numerizer` #726, 81M in total
- `phonelib` #732, 81M in total
- `bunny` #748, 78M in total
- `ruby_dep` #754, 78M in total (low confidence: Ruby version constraint helper for gemspecs)
- `swd` #781, 74M in total
- `monetize` #782, 74M in total
- `webfinger` #783, 74M in total
- `arr-pm` #798, 73M in total
- `rbtrace` #800, 72M in total
- `ruby-graphviz` #802, 72M in total
- `sigdump` #828, 69M in total
- `warning` #832, 69M in total
- `gherkin` #842, 67M in total
- `hitimes` #867, 63M in total
- `net-ssh-gateway` #912, 59M in total (low confidence: SSH tunneling helper on top of net-ssh; not command/SFTP client)
- `licensee` #920, 58M in total
- `rinku` #923, 58M in total
- `asciidoctor` #936, 56M in total
- `ref` #939, 56M in total
- `mock_redis` #944, 56M in total
- `rb-readline` #963, 54M in total
- `html-pipeline` #979, 54M in total

## Library internals

Sub-packages that exist only as implementation pieces of one parent library outside the compiler and linter world and have no standalone task of their own.

- `uber` #139, 378M in total
- `declarative` #140, 371M in total
- `request_store` #149, 356M in total (low confidence)
- `arel` #165, 331M in total (low confidence: SQL AST builder)
- `net-protocol` #177, 305M in total
- `orm_adapter` #190, 289M in total
- `temple` #214, 255M in total (low confidence: template compilation framework underlying slim/haml; not a renderer itself)
- `kaminari-core` #228, 242M in total
- `dry-logic` #246, 221M in total (low confidence: predicate rule composition used by dry-validation)
- `http-form_data` #272, 207M in total (low confidence: form-data body builders for the http gem)
- `fog-json` #292, 187M in total
- `ttfunk` #328, 166M in total (low confidence: Font parser internal to Prawn)
- `cocoapods-core` #391, 137M in total
- `celluloid-supervision` #446, 123M in total (low confidence: Piece of Celluloid)
- `celluloid-essentials` #449, 123M in total
- `debase-ruby_core_source` #450, 123M in total (low confidence: ruby core source files for C extensions)
- `celluloid-fsm` #451, 123M in total
- `celluloid-extras` #452, 123M in total
- `declarative-option` #459, 120M in total
- `pdf-core` #542, 100M in total
- `chef-utils` #928, 57M in total (low confidence: Chef internal utils)
- `chef-config` #933, 56M in total (low confidence: Chef internal config)
- `babel-source` #947, 55M in total

## Language-level abstractions

Trait definitions, declarative macros, error types, lazy statics, marker and wrapper types that shape code at compile time and have no standalone runtime task.

- `docile` #99, 505M in total (low confidence: DSL block helper, no runtime task)
- `timeout` #141, 368M in total (low confidence)
- `memoist` #167, 322M in total
- `trailblazer-option` #211, 260M in total
- `dry-core` #223, 246M in total (low confidence: support modules for dry-rb)
- `mutex_m` #262, 210M in total
- `dry-configurable` #287, 194M in total
- `sorbet-runtime` #347, 154M in total (low confidence: runtime type checking)
- `version_gem` #359, 145M in total (low confidence: version constant helper)
- `descendants_tracker` #360, 145M in total
- `nenv` #368, 143M in total (low confidence: ENV wrapper)
- `dry-initializer` #388, 137M in total (low confidence: initializer DSL)
- `equalizer` #411, 132M in total
- `axiom-types` #420, 130M in total (low confidence: type constraints definitions)
- `attr_required` #709, 84M in total (low confidence: attribute declaration mixin; unclear)
- `dry-equalizer` #750, 78M in total
- `with_env` #861, 64M in total (low confidence: tiny helper module)
- `memoizable` #895, 60M in total (low confidence: tiny helper module)

## System and foreign bindings

Bindings to operating system APIs, C libraries and other language runtimes, whose work is done by the code they wrap; prebuilt per-platform import libraries are out of scope.

- `ffi` #27, 1.1B in total
- `nio4r` #64, 699M in total (low confidence: IO selector wrapping libev)
- `ethon` #181, 301M in total
- `io-console` #222, 246M in total
- `debug_inspector` #274, 206M in total
- `security` #392, 137M in total
- `terminal-notifier` #394, 137M in total
- `simctl` #400, 136M in total
- `kgio` #434, 125M in total
- `kostya-sigar` #492, 112M in total (low confidence: system information gatherer)
- `openssl` #546, 99M in total
- `rugged` #616, 91M in total
- `libddwaf` #693, 86M in total
- `therubyracer` #903, 60M in total
- `gssapi` #914, 59M in total
- `gpgme` #919, 58M in total
- `libyajl2` #954, 55M in total
- `wmi-lite` #968, 54M in total

## Frameworks and broad libraries

Application frameworks, UI runtimes, DOM implementations and general-purpose standard libraries that span many tasks and cannot be reduced to one comparable benchmark.

- `activesupport` #7, 1.4B in total
- `rack` #12, 1.4B in total (low confidence: uncertain)
- `activemodel` #34, 902M in total
- `activerecord` #37, 846M in total
- `actionpack` #39, 834M in total
- `rails` #45, 797M in total
- `railties` #46, 796M in total
- `actionview` #48, 785M in total
- `actionmailer` #49, 781M in total
- `activejob` #61, 714M in total (low confidence: job abstraction over backends, part of Rails)
- `actioncable` #79, 611M in total
- `activestorage` #88, 548M in total
- `tins` #435, 125M in total (low confidence: grab-bag utility library)
- `sequel` #778, 75M in total (low confidence: broad database toolkit/ORM)

## HTTP clients

Send HTTP requests and read responses from Node.js; proxy agents, service-specific SDKs and header parsing helpers are out of scope.

- `faraday` #17, 1.3B in total
- `excon` #62, 713M in total
- `httpclient` #89, 541M in total
- `rest-client` #106, 487M in total
- `httparty` #107, 485M in total
- `sawyer` #127, 404M in total (low confidence)
- `typhoeus` #188, 292M in total
- `http` #251, 216M in total
- `net-http-persistent` #259, 211M in total
- `net-http` #283, 198M in total
- `nap` #289, 191M in total
- `httpi` #495, 111M in total
- `ruby_http_client` #907, 59M in total

## CLI argument parsing

Turn an argv array into structured options, positionals and subcommands; single-flag checks, prompts and terminal layout are out of scope.

- `thor` #25, 1.2B in total
- `claide` #216, 255M in total
- `slop` #342, 158M in total
- `commander` #352, 151M in total
- `optimist` #401, 135M in total
- `optparse` #444, 123M in total
- `gli` #488, 113M in total
- `mixlib-cli` #775, 75M in total
- `trollop` #857, 65M in total
- `clamp` #937, 56M in total

## Child process execution

Spawn a child process and collect its exit status and output; shell-string quoting, PATH lookup and signal tables are out of scope.

- `daemons` #168, 317M in total (low confidence: daemonizing)
- `childprocess` #173, 311M in total
- `launchy` #180, 302M in total (low confidence: launching apps)
- `open4` #351, 152M in total
- `shellany` #377, 141M in total
- `systemu` #496, 111M in total
- `mixlib-shellout` #582, 94M in total
- `terrapin` #760, 77M in total
- `tty-command` #916, 58M in total

## Environment detection

One-shot probes of the host such as CPU count and features, terminal state, user, host name, time zone and standard directories, which return in constant time and have no workload to scale.

- `os` #111, 474M in total
- `google-cloud-env` #156, 342M in total
- `tty-screen` #225, 244M in total
- `get_process_mem` #445, 123M in total
- `tty-color` #465, 118M in total
- `macaddr` #766, 76M in total
- `ohai` #772, 75M in total
- `sys-filesystem` #854, 65M in total
- `sys-uname` #958, 55M in total

## Terminal string styling

Wrap strings in ANSI color and style escape codes; stripping, measuring or wrapping already-styled text and color-support detection are out of scope.

- `rainbow` #53, 760M in total
- `formatador` #194, 285M in total (low confidence: STDOUT text formatting with color tags; unsure it is plain ANSI styling)
- `colored2` #219, 248M in total
- `colorize` #324, 169M in total
- `colored` #339, 159M in total
- `pastel` #469, 117M in total
- `ansi` #485, 113M in total
- `term-ansicolor` #564, 96M in total

## Static data and patterns

Packages that export only constant tables or a single regular expression and do no work of their own.

- `mime-types-data` #57, 748M in total
- `jquery-rails` #171, 313M in total
- `unicode-emoji` #316, 173M in total
- `emoji_regex` #379, 140M in total
- `countries` #410, 133M in total
- `tzinfo-data` #432, 126M in total
- `i18n_data` #538, 100M in total
- `gemoji` #899, 60M in total

## Template rendering

Compile a text template with embedded expressions, loops and partials (ERB, Haml, Slim, Liquid, Mustache and the like) and render it to a string with given data; Markdown conversion, HTML builders driven purely by code and framework view layers are out of scope.

- `tilt` #44, 798M in total
- `erubi` #73, 637M in total
- `erubis` #179, 302M in total
- `haml` #271, 207M in total
- `liquid` #378, 141M in total
- `erb` #439, 124M in total
- `slim` #617, 91M in total
- `mustache` #723, 82M in total

## Applications and daemons

Complete servers, daemons, command-line programs and websites that happen to be published as importable packages and are run rather than called for one task; build, lint and test tools and reusable frameworks are out of scope.

- `irb` #217, 251M in total
- `cocoapods` #374, 141M in total
- `foreman` #406, 134M in total
- `eye` #478, 115M in total
- `capistrano` #620, 90M in total (low confidence: Remote deployment/SSH command tool; no matching category)
- `fluentd` #856, 65M in total
- `license_finder` #922, 58M in total
- `einhorn` #929, 57M in total

## JSON parsing

Parse strict JSON text into JavaScript values with added behavior such as better errors, bigints or circular references; JSON supersets with comments and file I/O helpers are out of scope.

- `json` #9, 1.4B in total
- `multi_json` #24, 1.2B in total (low confidence: facade over multiple JSON libraries)
- `crack` #122, 418M in total (low confidence: also XML)
- `oj` #176, 309M in total
- `yajl-ruby` #502, 110M in total
- `json_pure` #807, 72M in total
- `ffi-yajl` #932, 57M in total

## Tooling internals (AST and code utilities)

Building blocks used inside compilers and linters, such as AST node helpers, traversal, scope analysis, tokenizing and code frames; standalone parsers are out of scope.

- `ast` #43, 805M in total
- `method_source` #50, 780M in total (low confidence: retrieves method source code)
- `rubocop-ast` #84, 571M in total
- `sexp_processor` #349, 153M in total
- `unparser` #527, 103M in total (low confidence: generate source from AST)
- `proc_to_ast` #741, 80M in total (low confidence: converts Proc to AST node)

## Binary serialization

Encode structured values to a compact binary format and decode them back, such as Protocol Buffers, MessagePack, CBOR and bincode; text formats, columnar data and byte-order helpers are out of scope.

- `msgpack` #92, 525M in total
- `google-protobuf` #113, 457M in total
- `bindata` #362, 145M in total
- `bson` #463, 119M in total
- `amq-protocol` #742, 80M in total (low confidence: AMQP 0.9.1 frame serialization)
- `thrift` #852, 66M in total (low confidence: Thrift RPC bindings incl. binary protocol)

## Date and time

Parse, format and do calendar arithmetic on dates, times and durations; time zone database packages, HTTP-date-only helpers and clock sources are out of scope.

- `date` #174, 310M in total
- `et-orbi` #240, 230M in total (low confidence: time zone helper for fugit)
- `fugit` #249, 218M in total (low confidence: cron parsing and occurrence computation)
- `chronic` #399, 136M in total
- `ice_cube` #607, 92M in total
- `timeliness` #996, 52M in total

## Structured logging

Application loggers that format records with levels and key-value fields, as JSON or colored text, and write them to a sink; environment-switched debug loggers, telemetry exporters and vendor log shippers are out of scope.

- `logger` #116, 431M in total (low confidence)
- `lumberjack` #344, 155M in total
- `logging` #507, 107M in total
- `mixlib-log` #841, 67M in total (low confidence: simple logging mixin)
- `mono_logger` #967, 54M in total (low confidence: lock-free logger)
- `console` #994, 53M in total

## Schema validation

Validate arbitrary JavaScript values against a declared schema and report errors; type-only helpers and schema traversal utilities are out of scope.

- `dry-types` #245, 222M in total (low confidence: type system with coercions and constraints)
- `json-schema` #284, 198M in total
- `dry-schema` #440, 124M in total
- `dry-validation` #461, 120M in total
- `json_schemer` #733, 81M in total

## HTML and XML parsing

Parse HTML or XML text into a tree or a stream of SAX events; DOM implementations, serializers, sanitizers and XML builders are out of scope.

- `nokogiri` #16, 1.3B in total
- `rexml` #38, 836M in total
- `multi_xml` #81, 607M in total (low confidence: swappable XML parsing backends)
- `xml-simple` #309, 178M in total
- `nori` #407, 134M in total

## Parser combinators and generators

Libraries for writing a parser for an arbitrary grammar from combinators or a grammar definition; parsers for one fixed format and lexer-only generators are out of scope.

- `racc` #58, 744M in total
- `raabro` #260, 210M in total
- `treetop` #575, 95M in total
- `parslet` #708, 84M in total
- `citrus` #779, 75M in total

## Image processing

Decode raster images, apply pixel operations such as resize and crop, and encode the result; single-format codecs, header-only size readers and OCR are out of scope.

- `mini_magick` #135, 385M in total
- `chunky_png` #261, 210M in total (low confidence: PNG-only codec with some pixel ops; borderline single-format codec)
- `ruby-vips` #404, 135M in total
- `image_processing` #419, 130M in total
- `rmagick` #930, 57M in total

## HTTP application servers

Listen on a socket, parse HTTP requests and hand them to an application callback through the language's standard server interface (Rack, WSGI/ASGI and the like); routers, middleware, reverse proxies and process supervisors are out of scope.

- `puma` #80, 611M in total
- `webrick` #109, 481M in total
- `thin` #266, 209M in total
- `rackup` #296, 185M in total (low confidence: Rack server launcher command rather than a server itself)
- `unicorn` #462, 120M in total

## Declared object serializers

Render application objects to JSON-ready structures through a declared serializer, presenter or builder that selects and nests attributes; raw JSON encoders, typed parsing of input into records and schema validation are out of scope.

- `representable` #136, 385M in total
- `jbuilder` #169, 315M in total
- `active_model_serializers` #383, 139M in total
- `jsonapi-renderer` #524, 104M in total
- `grape-entity` #865, 64M in total

## Runtime helpers and shims

Ponyfills, compiler helper runtimes and one-line predicates that stand in for built-in language or Node.js features and have no meaningful standalone task.

- `ruby2_keywords` #103, 494M in total
- `backports` #350, 153M in total
- `no_proxy_fix` #583, 94M in total
- `fast_blank` #864, 64M in total

## Async concurrency control

Run many async tasks with a concurrency limit or through a work queue; promisification, retry policies and single-call guards are out of scope.

- `concurrent-ruby` #10, 1.4B in total (low confidence: uncertain)
- `parallel` #40, 833M in total
- `celluloid-pool` #448, 123M in total (low confidence: actor pool)
- `async` #970, 54M in total

## HTML sanitizing

Strip disallowed tags, attributes and scripts from untrusted HTML according to an allow-list and return safe HTML; plain entity escaping and general HTML parsing are out of scope.

- `loofah` #56, 755M in total
- `rails-html-sanitizer` #60, 715M in total
- `sanitize` #384, 139M in total
- `rails-deprecated_sanitizer` #535, 101M in total

## PDF generation

Produce new PDF documents from text, tables and drawing commands or from HTML; reading, splitting and merging existing PDFs are out of scope.

- `prawn` #518, 105M in total
- `wicked_pdf` #690, 87M in total (low confidence: Rails-oriented wrapper that shells out to wkhtmltopdf for HTML to PDF)
- `combine_pdf` #901, 60M in total (low confidence: merges/parses PDFs as well as creating)
- `prawn-table` #926, 57M in total (low confidence: Prawn table plugin; needs Prawn to render)

## WebSocket messaging

Implement the WebSocket protocol as a client, a server or a bring-your-own-I/O state machine and exchange framed messages; Socket.IO-style layers on top, server-sent events and raw HTTP are out of scope.

- `websocket-driver` #70, 650M in total
- `websocket-extensions` #82, 599M in total (low confidence: extension manager for WebSocket connections)
- `websocket` #269, 208M in total
- `em-websocket` #882, 62M in total

## HTTP message parsing

Parse raw HTTP/1.x request and response bytes into method, target, headers and body chunks; full clients and servers, URL parsing and parsers for a single header are out of scope.

- `http-accept` #197, 279M in total
- `http_parser.rb` #305, 181M in total
- `llhttp-ffi` #508, 107M in total
- `http-parser` #949, 55M in total

## Message translation

Look up translated messages by key or source string in loaded catalogs, with interpolation and plural forms; locale data packages, framework glue and date or number formatting are out of scope.

- `i18n` #6, 1.4B in total
- `fast_gettext` #809, 71M in total
- `locale` #849, 66M in total (low confidence: locale detection/localization APIs; may not do catalog lookup)
- `gettext` #883, 62M in total

## Dynamic attribute objects

Wrap a nested dictionary in an object whose keys are read and written as attributes or method calls; declared record classes with typed fields and immutable collections are out of scope.

- `hashie` #105, 491M in total
- `ostruct` #333, 165M in total
- `snaky_hash` #417, 130M in total
- `recursive-open-struct` #811, 71M in total

## File system watching

Subscribe to create, write, rename and remove notifications for files and directories through the operating system's notification facility; following the appended lines of one log file and polling build watchers tied to one tool are out of scope.

- `rb-fsevent` #94, 517M in total
- `rb-inotify` #102, 495M in total
- `listen` #126, 404M in total
- `sass-listen` #304, 181M in total

## Generated API and schema types

Packages that consist of message, resource and specification types, mostly generated from Protocol Buffers, OpenAPI or other interface definitions, with no behavior beyond field access and serialization glue; the serialization runtimes and the clients that use the types are out of scope.

- `language_server-protocol` #178, 304M in total
- `googleapis-common-protos-types` #241, 229M in total
- `googleapis-common-protos` #483, 113M in total
- `grpc-google-iam-v1` #767, 76M in total

## Unique ID generation

Generate random, collision-resistant string identifiers; hashing of content and sequential counters are out of scope.

- `securerandom` #238, 232M in total (low confidence: SecureRandom offers uuid/hex/base64 random strings but is a general random source)
- `uuidtools` #540, 100M in total
- `uuid` #794, 73M in total

## Platform-specific binaries

Packages that only carry a prebuilt native executable or addon for one OS and CPU architecture.

- `libv8` #727, 81M in total
- `sorbet-static` #771, 75M in total
- `wkhtmltopdf-binary` #801, 72M in total

## HTML entity escaping

Escape and unescape HTML special characters and entities in strings; CSS, RegExp and JavaScript string escaping are out of scope.

- `htmlentities` #224, 245M in total
- `escape` #547, 99M in total (low confidence: description is empty ellipsis; guessing string escaping)
- `escape_utils` #871, 63M in total

## URL and URI parsing

Parse, resolve and serialize URL or URI strings into components; query-string decoding, route pattern matching and data: URL decoding are out of scope.

- `addressable` #15, 1.3B in total
- `uri` #212, 259M in total
- `fuzzyurl` #985, 53M in total

## JWT signing and verification

Sign and verify JSON Web Tokens or JSON Web Signatures; general hashing, OAuth clients and cloud credential providers are out of scope.

- `jwt` #41, 821M in total
- `json-jwt` #498, 111M in total
- `atlassian-jwt` #982, 53M in total

## Markdown rendering

Parse CommonMark-style Markdown text and render it to HTML or a syntax tree; converting HTML or office documents to Markdown, reStructuredText and terminal rendering are out of scope.

- `kramdown` #215, 255M in total
- `redcarpet` #396, 136M in total
- `commonmarker` #557, 97M in total

## JSON path queries

Evaluate a path or query expression such as JSONPath, JMESPath or JSON Pointer against in-memory JSON-like data and return the selected values; JSON parsing, JSON Patch and schema validation are out of scope.

- `jmespath` #5, 1.4B in total
- `jsonpath` #563, 96M in total
- `hana` #722, 82M in total (low confidence: JSON Patch plus JSON Pointer; only Pointer fits category)

## Typed object mapping

Convert plain dictionaries and lists into instances of declared record classes and back again, following the field types; validation-first schema libraries, binary wire formats and pickling of arbitrary objects are out of scope.

- `coercible` #405, 135M in total (low confidence: type coercion library, not record mapping)
- `virtus` #413, 131M in total
- `dry-struct` #885, 61M in total

## Background job queues

Enqueue jobs to a persistent backend such as Redis or a database and execute them in worker processes or threads; in-process task pools, cron-style schedulers and message-broker clients are out of scope.

- `sidekiq` #158, 339M in total
- `delayed_job` #838, 67M in total
- `resque` #953, 55M in total

## Redis clients

Speak the Redis protocol to send commands and decode replies; key namespacing wrappers, cache or session stores built on a client, in-memory fakes and job queues are out of scope.

- `redis` #83, 587M in total
- `redis-client` #334, 164M in total
- `hiredis` #696, 86M in total

## Ruby parsing

Parse Ruby source text into a syntax tree; AST node helpers, unparsers, type signature parsers and linters built on a parser are out of scope.

- `parser` #36, 850M in total
- `prism` #273, 207M in total
- `ruby_parser` #371, 142M in total

## User-agent parsing

Parse an HTTP User-Agent header string into browser, version, operating system and device information; full request parsing and bot-blocking middleware are out of scope.

- `browser` #354, 147M in total
- `useragent` #366, 143M in total
- `device_detector` #866, 64M in total

## Wrapping, slicing and stripping styled terminal text

Transform strings that may contain ANSI escape codes by stripping the codes, word-wrapping to a column width, or slicing and truncating by visible columns; only measuring display width, adding color styles and stripping indentation are out of scope.

- `word_wrap` #433, 126M in total
- `strings-ansi` #795, 73M in total
- `strings` #821, 71M in total

## Edit distance and string similarity

Score how similar two strings are with Levenshtein, Jaro-Winkler or a related metric, or pick the closest match from a list; producing the actual diff hunks and phonetic or full-text search are out of scope.

- `jaro_winkler` #382, 139M in total
- `fuzzy_match` #511, 106M in total
- `text` #847, 66M in total (low confidence: mixed text algorithms; Levenshtein is the benchmarkable part)

## Property list parsing

Read and write Apple property lists in their XML, binary or ASCII form as native values; Xcode project manipulation and general XML parsing are out of scope.

- `CFPropertyList` #206, 272M in total
- `plist` #252, 216M in total
- `nanaimo` #308, 180M in total

## Unicode normalization

Convert text to the Unicode normalization forms NFC, NFD, NFKC and NFKD; case folding, transliteration to ASCII and stringprep profiles are out of scope.

- `unf_ext` #90, 540M in total
- `unf` #97, 510M in total
- `unicode_utils` #375, 141M in total

## SSH and SFTP clients

Speak the SSH2 protocol as a client to run remote commands and transfer files over SFTP or SCP; SSH servers, deployment tools built on a client and SSH agent or key-file helpers are out of scope.

- `net-ssh` #132, 390M in total
- `net-scp` #237, 233M in total
- `net-sftp` #300, 184M in total

## XML building

Produce XML text from code through a builder interface or from nested native data structures; parsing XML, HTML template engines and DOM implementations are out of scope.

- `builder` #31, 938M in total
- `gyoku` #421, 129M in total
- `arbre` #956, 55M in total (low confidence: HTML builder DSL; closest to code-driven markup building)

## Config format parsing

Parse human-friendly, JSON-superset configuration text (YAML, JSON5, JSON with comments) into JavaScript values; binary formats, CSV and markup languages are out of scope.

- `psych` #221, 247M in total
- `safe_yaml` #254, 215M in total

## CSS stylesheet parsing

Parse a whole CSS stylesheet into an AST or object model; selector-only or value-only parsers, tokenizers and plugin-driven transformers are out of scope.

- `crass` #76, 624M in total
- `css_parser` #302, 183M in total

## Value inspection and formatting

Render arbitrary JavaScript values as human-readable strings for logs, assertions and snapshots; JSON serialization and diffing are out of scope.

- `awesome_print` #192, 289M in total
- `pp` #363, 144M in total

## HTTP server routing

Match incoming HTTP requests against registered routes and middleware and dispatch to a handler; single-purpose middleware, header utilities and full-stack frameworks are out of scope.

- `sinatra` #147, 359M in total
- `grape` #695, 86M in total

## Hash maps

General-purpose in-memory key-value hash tables, including insertion-ordered and concurrent variants; bounded caches, tries, slabs and the hash functions themselves are out of scope.

- `thread_safe` #78, 613M in total (low confidence: thread-safe hash/array collections)
- `hashery` #523, 104M in total (low confidence: Hash-like classes collection)

## TOML parsing

Parse TOML text into values or a document tree; JSON-superset formats such as YAML and JSON5, INI files and layered configuration loaders are out of scope.

- `tomlrb` #534, 101M in total
- `toml-rb` #768, 76M in total

## Authenticated encryption

Encrypt and decrypt byte buffers with an AEAD cipher such as AES-GCM or ChaCha20-Poly1305; bare block and stream ciphers, TLS and public-key cryptography are out of scope.

- `encryptor` #442, 124M in total (low confidence: OpenSSL wrapper, default cipher may not be AEAD)
- `aes_key_wrap` #516, 105M in total (low confidence: AES key wrap RFC 3394, not strictly AEAD)

## Text diffing

Compute the line or element differences between two texts or sequences; edit-distance scores, assertion pretty-printers and structured JSON patches are out of scope.

- `diff-lcs` #19, 1.2B in total
- `diffy` #505, 109M in total

## Identifier case conversion

Convert strings between naming conventions such as camelCase, snake_case and kebab-case; Unicode case folding and case-insensitive comparison are out of scope.

- `dry-inflector` #235, 235M in total (low confidence: inflection (camelize/underscore/etc) rather than pure case conversion)
- `case_transform` #568, 96M in total

## Character encoding detection

Guess the character encoding of a byte buffer of unknown text; transcoding between known encodings and encoding alias tables are out of scope.

- `rchardet` #332, 165M in total
- `charlock_holmes` #840, 67M in total

## File type detection

Identify the format or media type of a file or buffer from its content and magic numbers; extension-to-MIME lookup tables and image dimension readers are out of scope.

- `marcel` #104, 491M in total
- `mimemagic` #288, 193M in total

## Password hashing

Hash and verify passwords with a deliberately slow, salted algorithm such as bcrypt, scrypt or Argon2; fast message digests, HMAC and general key derivation are out of scope.

- `bcrypt` #120, 418M in total
- `bcrypt_pbkdf` #499, 111M in total (low confidence: bcrypt-based KDF, not password hashing proper)

## Sorted maps and prefix trees

Mutable in-memory key-value containers that keep keys in sorted order, such as B-trees, radix trees and skip lists, and support ordered, range or prefix iteration; hash tables, persistent immutable variants, bounded caches and on-disk stores are out of scope.

- `rbtree` #803, 72M in total
- `sorted_set` #868, 63M in total (low confidence: sorted Set variant, not key-value)

## QR code generation

Encode a text or byte payload into a QR code module matrix and render it as SVG, an image or text; QR code scanning and other barcode symbologies are out of scope.

- `rqrcode` #415, 131M in total
- `rqrcode_core` #681, 87M in total

## MIME type lookup

Map a file name or extension to its media type and a media type back to its extensions, using a built-in table; sniffing content from bytes and parsing media type header values are out of scope.

- `mime-types` #32, 934M in total
- `mini_mime` #35, 893M in total

## Public suffix lookup

Split a host name into subdomain, registrable domain and public suffix using the Public Suffix List; IDNA conversion, URL parsing and DNS resolution are out of scope.

- `public_suffix` #18, 1.2B in total
- `domain_name` #67, 680M in total

## Layered configuration loading

Merge settings from defaults, configuration files and environment variables into one object and read typed values from it by key; parsers for a single file format, dotenv loading alone and discovery of tool rc files are out of scope.

- `mixlib-config` #810, 71M in total
- `config` #915, 58M in total

## Terminal progress bars and spinners

Render a progress bar or spinner line for a running task and redraw it as the task advances; interactive prompts, full terminal UI toolkits and plain log output are out of scope.

- `ruby-progressbar` #54, 755M in total
- `tty-spinner` #329, 166M in total

## Syntax highlighting

Tokenize source code in a given language and emit it as highlighted HTML or ANSI-colored text; full parsers that build an AST, linters and Markdown rendering are out of scope.

- `coderay` #71, 644M in total
- `rouge` #166, 330M in total

## Spreadsheet file reading

Open existing spreadsheet workbook files such as XLSX or XLS and read their sheets and cell values; creating workbooks, CSV parsing and dataframes are out of scope.

- `roo` #471, 116M in total
- `spreadsheet` #718, 83M in total

## ASCII transliteration and slugs

Replace accented and non-Latin characters with their closest ASCII equivalents, optionally producing a URL slug; Unicode normalization forms, case conversion and percent encoding are out of scope.

- `babosa` #315, 175M in total
- `sixarm_ruby_unaccent` #598, 93M in total

## SMTP clients

Build an email message and submit it to a mail server over SMTP; IMAP and POP3 retrieval, vendor email API SDKs and SMTP servers are out of scope.

- `mail` #51, 772M in total
- `net-smtp` #163, 332M in total

## Fake data generation

Generate realistic-looking fake values such as names, addresses, emails and dates for tests and fixtures; bare random number generators, unique ID generators and property-based testing frameworks are out of scope.

- `faker` #153, 346M in total
- `ffaker` #785, 74M in total

## File existence lookup

Find the first existing file or directory among candidate paths or by walking up parent directories; glob expansion, executable PATH lookup and module resolution are out of scope.

- `hike` #675, 87M in total (low confidence: Finds files across a set of search paths)

## Object merging

Copy or recursively merge properties of source objects into a target object; cloning a single value, immutable-update libraries and Object.assign ponyfills are out of scope.

- `deep_merge` #441, 124M in total

## Event emitters

In-process publish/subscribe objects with on/off/emit semantics; DOM EventTarget implementations, plugin hook systems and reactive streams are out of scope.

- `wisper` #467, 118M in total

## Tar archiving

Create and extract tar archives; the underlying compression codecs and other archive formats are out of scope.

- `minitar` #924, 58M in total

## Arbitrary-precision arithmetic

Number classes for integers or decimals beyond double precision; fixed-width 64-bit integer wrappers, number formatting and random number generation are out of scope.

- `bigdecimal` #96, 514M in total

## Terminal string width

Compute how many terminal columns a string or code point occupies, accounting for wide East Asian characters; wrapping, truncating and stripping styled text are out of scope.

- `unicode-display_width` #30, 995M in total

## LRU caches

Bounded in-memory key-value caches that evict the least recently used entry; unbounded maps, memoization decorators and remote cache clients are out of scope.

- `lru_redux` #813, 71M in total

## Non-cryptographic hashing

Fast hash functions for hash tables and fingerprints, such as FNV, xxHash, SipHash and Murmur; cryptographic digests and error-detecting checksums are out of scope.

- `murmurhash3` #908, 59M in total

## Checksums

Compute error-detecting checksums such as CRC-32, CRC-32C and Adler-32 over byte buffers; cryptographic digests and hash-table hashes are out of scope.

- `digest-crc` #170, 314M in total

## Base64 encoding

Encode bytes to base64 text and decode them back; hexadecimal, base58 and other alphabets, and PEM framing are out of scope.

- `base64` #91, 534M in total

## Digital signatures

Generate key pairs, sign messages and verify signatures with ECDSA, Ed25519 or RSA; signature trait definitions, JWT framing and certificate handling are out of scope.

- `ed25519` #409, 133M in total

## PDF reading

Open existing PDF files and extract their text and page structure; creating new PDFs and rasterizing pages through external command-line tools are out of scope.

- `pdf-reader` #475, 115M in total

## Text table rendering

Lay out rows of values as an aligned plain-text or ASCII table; full terminal UI toolkits, progress bars and spreadsheet files are out of scope.

- `terminal-table` #119, 424M in total

## Retry policies

Re-run a failing function according to a policy of attempts, backoff and jitter, or guard it with a circuit breaker; rate limiters, task queues and HTTP-client-specific transports are out of scope.

- `retriable` #125, 410M in total

## PostgreSQL clients

Speak the PostgreSQL wire protocol to run queries and decode result rows; ORMs, query builders, connection-pool add-ons and drivers for other databases are out of scope.

- `pg` #110, 476M in total

## MySQL clients

Speak the MySQL wire protocol to run queries and decode result rows; ORMs, query builders and drivers for other databases are out of scope.

- `mysql2` #226, 244M in total

## Dotenv loading

Parse a .env file of KEY=value lines, with quoting and variable expansion, and load the pairs into the process environment or a map; decoding environment variables into typed structs and general INI or configuration managers are out of scope.

- `dotenv` #87, 555M in total

## Semantic version comparison

Parse semantic version strings, order them and test them against range constraints; language-specific version schemes with no range syntax and dependency resolvers are out of scope.

- `semantic_range` #848, 66M in total

## Metrics instrumentation

In-process registries of counters, gauges, timers and histograms that application code updates and that render a snapshot for a monitoring system; standalone histogram data structures, distributed tracing and vendor agents that only ship data to one service are out of scope.

- `prometheus-client` #830, 69M in total

## MongoDB clients

Speak the MongoDB wire protocol to run commands and encode and decode BSON documents; object-document mappers and drivers for other databases are out of scope.

- `mongo` #517, 105M in total

## ZIP archiving

Create ZIP archives from in-memory entries and read entries back out of them; tar archives, bare deflate or gzip codecs and other container formats are out of scope.

- `rubyzip` #47, 795M in total

## Cron expression scheduling

Parse cron expressions and compute the next matching run times, optionally firing callbacks on that schedule; persistent job queues, process managers and general date arithmetic are out of scope.

- `rufus-scheduler` #367, 143M in total (low confidence: Job scheduler with cron/at/every; benchmark would need next-time computation via fugit)

## Dependency injection containers

Register service providers in a container and resolve instances together with their transitive dependencies at run time; compile-time code generators, framework-bound module systems and plain service locators inside one framework are out of scope.

- `dry-container` #387, 138M in total (low confidence: Simple item registry; no transitive dependency resolution)

## HTTP cookie parsing

Parse Cookie and Set-Cookie header values into names, values and attributes and serialize them back; signing or encrypting cookie values and server session stores are out of scope.

- `http-cookie` #65, 692M in total

## IP address and CIDR parsing

Parse IPv4 and IPv6 address and CIDR network strings into values, and test whether an address falls inside a network; DNS lookups, socket handling and geolocation databases are out of scope.

- `ipaddress` #297, 185M in total

## IDNA and Punycode conversion

Convert internationalized domain names between Unicode and their ASCII Punycode form according to IDNA or UTS #46; public suffix lookup, full URL parsing and DNS resolution are out of scope.

- `simpleidn` #780, 75M in total

## Atomic file writing

Write a file so that readers see either the old or the complete new content, by writing to a temporary file and renaming it into place; advisory file locking, plain file copy and temporary file creation alone are out of scope.

- `atomos` #335, 163M in total

## SQL parsing

Parse SQL statements into tokens or a syntax tree; executing queries, database drivers, query builders and object-relational mappers are out of scope.

- `pg_query` #822, 70M in total

## GraphQL execution

Parse GraphQL documents, validate them against a schema and execute them against in-process resolvers; HTTP clients that only send queries to a remote server and web framework integrations are out of scope.

- `graphql` #276, 205M in total

## CSV parsing

Parse delimited text with quoting and escaping into records and write records back as CSV; spreadsheet file formats, dataframes and fixed-width formats are out of scope.

- `csv` #275, 206M in total

## Spreadsheet file writing

Create spreadsheet workbook files such as XLSX from rows of cell values, with formats and multiple sheets; reading existing workbooks, CSV output and dataframes are out of scope.

- `caxlsx` #975, 54M in total

## HTML to Markdown conversion

Convert HTML markup into equivalent Markdown text; rendering Markdown to HTML, HTML sanitizing and readability-style article extraction are out of scope.

- `reverse_markdown` #520, 105M in total

## JSON Patch

Apply RFC 6902 JSON Patch or RFC 7386 merge patch operations to a JSON document, or compute the patch that turns one document into another; path queries that only read values and text diffs are out of scope.

- `hashdiff` #117, 431M in total (low confidence: closest is structured diff of hashes; not a true JSON Patch)

## Character set transcoding

Decode bytes in a legacy character encoding such as Shift_JIS, GBK or windows-1252 to Unicode text and encode text back; guessing an unknown encoding, base64 and UTF-8 validation alone are out of scope.

- `nkf` #470, 117M in total

## Natural sort order

Compare or sort strings so that embedded numbers are ordered by numeric value, as in file2 before file10; full locale-aware collation and semantic version ordering are out of scope.

- `naturally` #390, 137M in total

## Unauthenticated symmetric ciphers

Encrypt and decrypt bytes with a bare block or stream cipher and its mode of operation, such as AES-CTR, AES-CBC, ChaCha20 or Salsa20; authenticated AEAD constructions, public-key cryptography and TLS are out of scope.

- `ruby-rc4` #430, 127M in total

## One-time passwords

Generate and verify HOTP and TOTP codes from a shared secret according to RFC 4226 and RFC 6238; password hashing, WebAuthn and full authentication frameworks are out of scope.

- `rotp` #376, 141M in total

## Linear algebra and arrays

Dense vector, matrix and n-dimensional array types with element-wise arithmetic, matrix multiplication and decompositions; dataframes, arbitrary-precision numbers and machine learning frameworks are out of scope.

- `matrix` #307, 181M in total

## Graph algorithms

In-memory graph structures of nodes and edges with traversal, topological sort, shortest path and connected component algorithms; graph drawing and layout, graph databases and dependency version solvers are out of scope.

- `tsort` #788, 73M in total

## Synchronization primitives

In-process mutexes, read-write locks, condition variables, spin locks and thread parking that guard shared state between threads or tasks; cross-process file locks, message channels and distributed locks are out of scope.

- `sync` #833, 68M in total

## Resource pools

Hold a bounded set of reusable resources such as connections or buffers and check them out to and back in from concurrent callers; driver-specific connection pools, worker task pools and caches are out of scope.

- `connection_pool` #59, 739M in total

## Kafka clients

Speak the Apache Kafka protocol to produce records to topics and consume them back; clients for other brokers such as AMQP, NATS or MQTT and stream processing frameworks are out of scope.

- `ruby-kafka` #694, 86M in total

## SQLite clients

Open a SQLite database from the host language, run statements and decode result rows; object-relational mappers, query builders and drivers for database servers are out of scope.

- `sqlite3` #285, 197M in total

## Git repository access

Read and write Git repositories from a program: walk commit history, read trees and blobs and create commits; hosting-service API clients, repository URL parsers and unified diff parsers are out of scope.

- `git` #264, 210M in total

## SOCKS proxy clients

Open TCP connections through a SOCKS4 or SOCKS5 proxy by performing the client side of the handshake; HTTP CONNECT proxies, SOCKS servers and SSH tunnels are out of scope.

- `socksify` #740, 80M in total
