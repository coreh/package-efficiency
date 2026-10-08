# Run a JavaScript program and read its result

One operation runs a JavaScript program, given as source text, in a new
interpreter context and returns the value of its last expression statement: a
number or a string. The category has one task per guest language, because the
program is the input: a Lua run is never compared with a JavaScript run. This
is the JavaScript guest. Programs are plain ES5, so every engine reads them.

The six fixtures:

- recursive `fib(22)` (a number, 17711);
- 500 pseudo-random integers from a fixed generator, sorted with a
  comparison function, reported as "first,middle,last,weighted checksum" (a string);
- a 400-piece string built with `push` and `join` (about 4 KB);
- the harmonic sum of 1/i for i up to 1,000 (a non-integer number, compared exactly);
- a probe that sets a global variable and a property on `Array.prototype` and
  reports the counters, twice in a row.

## What counts as correct

The result must have the type of the expected value and equal it exactly. The
expected values are computed in `scenario.mjs` by plain host functions, not by
any interpreter library. The probe is there to fail an implementation that
reuses a context: a fresh context answers 11 both times, a reused one 11 and
then 21. An implementation that does not run the program (it returns the
source, a constant or the first fixture's answer) fails the other fixtures.

Accepted differences, all about how an integer is represented and not about
the value: a whole number may come back as an integer or as a float
(17711 or 17711.0), because engines and bindings differ and the check is on
the number. Floats must be bit-identical (the sum is IEEE arithmetic in the
same order in every engine).

## What is measured

Creating the interpreter (runtime and context, or a new V8 isolate), parsing
and running the program, and copying the result out to the host language are all
inside the timed call, in every language, because a fresh context per run is the
task. Nothing is cached between calls and no program is compiled outside the
call. Packages run with their default options. `node:vm` is the host
runtime's own engine (V8 in Node and Deno, through their `node:vm` layers in
Bun) and is listed as the built-in. Whether a binding starts a native engine,
a WebAssembly module or an interpreter written in the host language shows up
in the figures and is not hidden.

Left out: `goja` (no release at least seven days old builds with the pinned
Go), PyPI `py-mini-racer` and `quickjs` (no eligible wheel for the pinned
Python), packages that cannot return a completion value (`sval` only exposes
`exports`), packages that launch an external runtime (`execjs`), and
`@eyurtsev/pyodide-sandbox`, which runs Python and is asynchronous. The sort is
500 numbers because `js-interpreter`'s sort is quadratic and takes 23 s for
2,000. `dukpy` has no pure-Python wheel, so it is not available on PyPy.
