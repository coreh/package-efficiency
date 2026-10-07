# CRC-32 over a stream of chunks

One operation takes a list of chunks (a message split the way a network read
loop, a file reader or a compressor's output buffer delivers it) and returns the
CRC-32 (IEEE 802.3, as in gzip, zlib and PNG) of the concatenation of the chunks'
UTF-8 bytes, as an unsigned 32-bit number. The work is the incremental API of
each library: one running state, updated once per chunk, finished at the end.
This differs from the one-buffer task: the per-update cost and the state
handling dominate when chunks are small.

The 41 cases are messages of 1 KB to 64 KB cut into chunks of 16, 64, 512, 1024
and 4096 characters (the last chunk is shorter), made of log lines, JSON
documents, ASCII text and Unicode prose, plus a one-chunk message, a message of
empty chunks mixed with real ones, and a single empty chunk. Chunk boundaries never split
a character, so every chunk is a whole string whose bytes are its UTF-8 encoding.

The result must equal an independent bitwise reference over the concatenated
bytes. A library that ignores the running state, or restarts for each chunk,
fails. Packages run with their default settings as installed, with no cached
results between calls. Chunk handling that is the same for all languages
(iterating the list, encoding a string chunk to bytes) is part of the measured
call, in every language.

## Entries

- `buffer-crc32`: `crc32.unsigned(chunk, previous)` for every chunk, passing the
  previous unsigned result as the partial CRC.
- `@deno-library/crc32`: a `Crc32Stream` created once at module load; each
  call does `reset()` (the package rebuilds its lookup table there, as part of
  its own API) then `append(chunk)` per chunk and reads the final hex string,
  parsed to a number inside the call.
- Node `zlib.crc32(chunk, previous)`, Python `zlib.crc32(bytes, previous)`,
  Ruby `Zlib.crc32(chunk, previous)`, Go `crc32.Update`.
- `crc32fast`: `Hasher::new()`, `update` per chunk, `finalize()`.
- `crc`: a `Crc<u32>` (CRC_32_ISO_HDLC) built once as a constant, a `Digest` per
  call, `update` per chunk, `finalize()`.

Adler-32, CRC-32C and other polynomials are not measured; `adler2`,
`simd-adler32` and `crc32c` compute different checksums, so they are left out.
