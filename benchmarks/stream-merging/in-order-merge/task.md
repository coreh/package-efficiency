# Merge readable streams in order

One operation is given `sources` (10 or 100), `chunks` per source (16 to 64)
and a chunk `size` (1,024), merges the sources **one after another** into one
stream, reads that stream to its end, and returns the chunks it emitted, in
order. There are 3 fixtures.

Every adapter does the same steps, inside the measured call:

1. create `sources` fresh readable streams (they are single use); source `s`
   emits `chunks` Buffers of `size` bytes, where byte `j` of chunk `c` is
   `(s*31 + c*7 + j*3) & 255`. Node streams (`Readable.from(chunks)`) for
   merge2, combined-stream and the builtin; a Web `ReadableStream`
   (`ReadableStream.from(chunks)`) for @std/streams, whose functions take Web
   Streams;
2. merge them with the package, in source order, default options;
3. read the merged stream until it ends, keeping each chunk it emits.

The check concatenates the returned chunks and compares them with the expected
bytes: the total length and every byte, so a missing, repeated, truncated or
reordered source fails. Chunk boundaries are not compared, since a merge may
re-cut them. Building the chunk Buffers happens in the call and is the same
in every adapter.

One thread (`load.threads` is 1): the event loop of the runtime. No timer or
sleep is involved.

Not compared: `merge-stream`, which interleaves sources as they emit and does
not keep their order, so it does not do this job (its parallel counterparts
are merge2 with arrays and `mergeReadableStreams`, a different task).
`merge2` and `combined-stream` need Node streams, so they do not run on Deno
unless its Node compatibility layer provides them.

See [shared methodology](../../README.md) for timing and reproduction.
