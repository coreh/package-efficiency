# scrypt hash and verify

One operation takes a pair of strings, the right password and a wrong one, and
does what a login system does: hash the right password with scrypt and a fresh
random salt, then check the right password and the wrong password against that
hash. The result is a list of two booleans. There are 32 fixtures, built
deterministically: short and long passwords, punctuation, accented and CJK
text, emoji, spaces, and wrong passwords that differ by one character, by case
or by a trailing space.

A correct output is exactly `[true, false]`. A package that accepts the wrong
password, rejects the right one or cannot verify its own hash fails.

Cost is fixed to the same value for every package: scrypt with N=4096 (log2 = 12),
r=8, p=1, a 32-byte key and a fresh 16 to 32 byte random salt per hash. Packages
whose defaults are different (some default to N=131072) are given these
parameters explicitly; everything else is left at its default.

Accepted as equivalent: the stored hash format. Packages produce their own
(PHC strings for the Rust crate and the JSR package); the standard-library
adapters for Node.js, Python and Ruby have no hash string format, so they hold the
salt and derived key, and verify by deriving the key again and comparing it in
constant time. Salt generation, key derivation and the comparison are inside the
timed call in every adapter. Nothing is cached between calls.

Only scrypt is measured because bcrypt and Argon2 have no cost setting equal to
scrypt's. Packages that do only those algorithms are left out.
