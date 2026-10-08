# User-agent parsing to browser and operating system

One operation takes a `User-Agent` header string and returns the browser
family, the browser's version and the operating system family. The 256 inputs
are distinct, written by a generator that knows the answer for each: Chrome,
Edge (Chromium), Firefox, Opera and Safari on Windows, macOS, Linux, Android
and iOS (13 browser and system pairs). Chrome numbers 90 to 129, Safari 14 to
18. Edge and Opera strings carry a `Chrome/` and a `Safari/` token as real ones
do, so a parser that stops at the first familiar token reports Chrome.

No runtime's standard library parses User-Agent strings, so there is no
`builtin/` entry.

## What counts as correct

The result is `{ browser, version, os }`, each as the library names it; the
adapter returns the library's values and does no cleaning. The scenario reads
them like this:

- **browser:** lower case, letters only, with "mobile" and "microsoft" taken
  out, then one of the accepted spellings: `chrome`; `firefox`; `safari` or
  `ios` (detect-browser names mobile Safari `ios`); `edge`, `edgechromium`,
  `chromiumedge`, `edg`; `opera`. "Chrome Mobile", "Mobile Safari" and
  "Microsoft Edge" are therefore the same families as without the prefix.
- **version:** only the part before the first `.` is read, so `"120"`,
  `"120.0.6099.71"` and `120` are equal, and must be the major version of the
  browser itself (for Edge the `Edg/` number, for Safari the `Version/` number,
  not the WebKit build).
- **os:** lower case, letters only, then read by its start: `windows*`;
  `macos*`, `osx*`, `macintosh*`, `mac*`; `linux*`, `genericlinux*`; `android*`;
  `ios*`, `iphone*`. "Windows 10", "OS X 11.6.8", "Linux i686", "Generic Linux",
  "iOS (iPhone)" and "iPhone OS" are accepted. System versions, architectures
  and device models are not compared.

Each string must come out as exactly the family, major version and system
family that generated it. An implementation that takes the first familiar
token, or returns the string, fails (checked when this task was written).

## What differs between the packages

- **Packages that get it wrong** are recorded as not passing, not accepted:
  gem `useragent` reports Edge as Chrome (it does not read `Edg/`); PyPI
  `httpagentparser` reports Android Chrome as "Linux" and gives no system for
  Android Firefox. The other packages agree on every string.
- **Caches.** `ua-parser` (PyPI, 2000 entries), `device_detector` (gem, 5000
  keys) and `ua-parser/uap-go` (1024 entries) keep results by string in their
  default configuration, and 256 strings fit in all three, so after the first
  pass every call is a hit. Their default entries are measured as they come;
  beside each is a variant that makes the cache too small to hit
  (`ua-parser-no-cache`, `device_detector-small-cache`,
  `ua-parser-uap-go-cache-size-1`) and that is what parsing costs. The
  `user-agents` package (PyPI) also caches, but only 200 strings, which a cycle
  of 256 never hits.
- **Work done.** Libraries differ in how much they parse: `ua-parser-js`,
  `ua-parser` and `uap-go` are asked for the browser and the system only (the
  device is skipped); `user-agents`, `bowser`, `platform`, `device_detector`,
  `woothee` and `medama-io/go-useragent` have no narrower call, or none that
  the documentation shows, and do what `parse` does.
- **Bots and unknown strings** are not in the fixtures.

Left out: JSR has no User-Agent parser. Crates `uaparser` and
`user-agent-parser` need a regex file outside the crate. Go
`avct/uasurfer` has no release old enough that builds with the pinned Go.

Fixtures are fixed; there is no randomness, clock or network. See
[shared methodology](../../README.md) for timing and reproduction.
