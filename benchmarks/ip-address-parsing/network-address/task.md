# Network address of a CIDR string

One operation takes a CIDR string such as `10.1.2.3/16` or
`2001:DB8:0:0:ABCD::1/48`, parses it, clears the host bits and returns the
network address as canonical text without the prefix length (`10.1.0.0`,
`2001:db8::`). Parsing and formatting happen inside the measured call, every
time; nothing is cached between calls. Result is a string in every language.

The 88 cases are 44 IPv4 and 44 IPv6 strings, with prefix lengths from /0 to
/32 and /0 to /128. Host bits are set in the input, so returning the input,
or just the address part, fails. IPv6 inputs are spelled in upper case, with
leading zeros, uncompressed, or compressed by hand; every third IPv6 network has
several zero groups so that `::` compression matters. Expected strings are
computed in the scenario with BigInt arithmetic and an RFC 5952 formatter,
independently of any package, and compared exactly.

Fixtures were chosen so that every accepted spelling is the same: networks whose
canonical form would contain a lone zero group, or two equally long zero
runs, are excluded, because libraries differ there (RFC 5952 and older
styles). Out of scope: invalid input, IPv4-mapped addresses, zone identifiers,
shorthand IPv4. Packages run with their default settings as installed.

Entries: `ipaddr.js` (`networkAddressFromCIDR`, `toString`); `ip-address`
(`Address4`/`Address6` parse, `startAddress()`, `correctForm()`); Rust `ipnet`
(`IpNet` parse, `network()`) and `ipnetwork` (`IpNetwork` parse, `network()`);
standard library: Python `ipaddress`, Ruby `IPAddr`, Go `net/netip`. In JavaScript
the family is picked with a `:` check, as the packages have separate classes.
JavaScript has no built-in CIDR parser.

See [shared methodology](../../README.md) for timing and reproduction.
