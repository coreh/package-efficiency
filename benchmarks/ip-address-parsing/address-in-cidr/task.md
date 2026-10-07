# Address in CIDR network

One operation takes a pair of strings, an IP address and a CIDR network such as
`10.1.0.0/16` or `2001:db8::/32`, parses both, and returns a boolean: is the
address inside the network. Parsing happens inside the measured call, every
time; nothing is cached between calls.

The 72 cases are 36 IPv4 and 36 IPv6 pairs, always of the same family. Prefix
lengths run from /0 to /32 and /0 to /128, including host routes. Half of the
addresses are inside (random-looking hosts, the first and last address of the
network); the rest are outside, including the addresses just before and just
after the network and ones that differ from it in a single bit. IPv6 addresses
are written in full, compressed (`::`) and with upper-case digits. Network
strings are in canonical form (no host bits set), and IPv4 uses plain dotted
decimal without leading zeros.

Each expected boolean is computed in the scenario from the integer values with
BigInt arithmetic, independently of any package, and asserted exactly.

Out of scope, because libraries differ: invalid input, IPv4-mapped IPv6
addresses, zone identifiers, mixed-family pairs, and non-canonical or
shorthand IPv4 notations. Packages run with their default settings as
installed.

Where a package's API has no single call for this, the adapter parses the
address and the network with that package's own parsers and uses its
containment/match method. Result is a boolean in every language.

Standard-library entries: Python `ipaddress`, Ruby `IPAddr`, Go `net/netip`.
JavaScript has no built-in that parses a CIDR and tests membership in one
call (`net.BlockList` needs a stateful object built beforehand), so there is
no JavaScript built-in entry.

Rust crates: `ipnet` (`IpNet` parse, `contains`) and `ipnetwork`
(`IpNetwork` parse, `contains`); the address is parsed with the standard
library's `IpAddr`, as both crates' documentation shows.

See [shared methodology](../../README.md) for timing and reproduction.
