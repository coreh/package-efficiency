# Set-Cookie header parsing

One operation parses one `Set-Cookie` response header string
(`sid=abc123; Path=/; Domain=example.com; Max-Age=3600; Secure; HttpOnly; SameSite=Lax`)
into the common shape below. The 48 inputs are realistic headers: session
ids, base64url tokens, JWT-like values, numbers, flags, empty values, with
between zero and six attributes in varied order and varied letter case
(`Path`, `path`, `HTTPONLY`, `samesite=strict`).

A correct result is an object with exactly these keys:

- `name`, `value`: strings, exactly as written.
- `path`, `domain`: the attribute's string, or `null` when absent.
- `maxAge`: the `Max-Age` seconds as a number, or `null` when absent.
- `secure`, `httpOnly`: booleans.
- `sameSite`: `"lax"`, `"strict"` or `"none"` (lower case), or `null` when absent.

Packages return different shapes (a plain object with `undefined` fields, a
`Cookie` class instance, a borrowed Rust `Cookie`, a Go `http.Cookie` struct, a
Python `Morsel`); each adapter builds the same common object inside the measured
call, in every language: an object in JavaScript, a dict in Python, a struct in
Go and in Rust. The Rust crate's `Cookie::parse` borrows from the input, so its
adapter copies the name, value, path and domain into owned strings, which is
what the other entries' results hold.

Left out of the fixtures because the packages, with default settings, do not
agree on one exact value:

- `Expires`: some packages turn it into a date, Python keeps the string. Fixtures
  carry no `Expires`, so no package pays for date parsing.
- Percent escapes and double-quoted values (npm `cookie` decodes the first;
  Python and Go unquote the second), leading dots in `Domain` and attributes
  that not every package knows (`Priority`, `Partitioned`).

Only parsing is measured, not serialization, cookie jars or signed values.
`Set-Cookie` headers carry one cookie each. Packages run with their default
settings as installed.
See [shared methodology](../../README.md) for timing and reproduction.
