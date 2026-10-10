# Run a Lua script and read its result

One operation runs a Lua chunk, given as source text, in a new interpreter
state and returns the value of its final `return` statement: a number or a
string. The category has one task per guest language, because the script is
the input: a Lua run is never compared with a JavaScript run. This is the Lua
guest.

The scripts stay inside what every engine here reads the same way: Lua 5.1
(gopher-lua, LuaJIT), 5.3 (fengari), 5.4 (mlua's vendored Lua) and piccolo.
That means the core language and the `math` table only. piccolo's standard
library has no `table.sort`, `table.concat` or string functions, so the sort is
a heap sort written in Lua and the string is built with `..`. Lua 5.1 has only
floats, while 5.3 and later have integers that print differently from floats,
so nothing that becomes text is ever divided with `/`. fengari's integers are
32 bits, so every integer stays below 2^31; `scenario.mjs` asserts both at load,
step by step, for its own reference.

The six fixtures:

- recursive `fib(22)` (a number, 17711);
- 2,000 integers from a fixed linear congruential generator, heap-sorted by
  code in the script, reported as "first,middle,last,weighted checksum" (a
  string);
- a 400-piece string built with `..` in a loop (about 4 KB);
- the harmonic sum of 1/i for i up to 1,000 (a non-integer number, compared exactly);
- a probe that sets a global variable and a field of the built-in `math`
  table and reports the counters, twice in a row.

## What counts as correct

The result must have the type of the expected value and equal it exactly. The
expected values are computed in `scenario.mjs` by plain host functions, not by
any interpreter library. The probe is there to fail an implementation that
reuses a state: a fresh state answers 11 both times, a reused one 11 and then
21. An implementation that does not run the script (it returns the source, a
constant or the first fixture's answer) fails the other fixtures, and the
generated numbers left unsorted give another string. `scenario.mjs` checks at
load that each of these is refused.

Accepted differences, all about how a number is represented and not about its
value: a whole number may come back as an integer or as a float (17711 or
17711.0), because Lua 5.1 has only floats and later versions have both. Floats
must be bit-identical (the sum is IEEE arithmetic in the same order in every
engine).

## What is measured

Creating the interpreter state with its standard libraries, compiling and
running the chunk, and copying the result out to the host language are all
inside the timed call, in every language, because a fresh state per run is the
task. Nothing is cached between calls and no chunk is compiled outside the
call. Packages run with their default options. Whether a package binds the
reference C implementation, runs a Lua written in the host language (Go, Rust,
JavaScript) or something else shows up in the figures and is not hidden.

The packages, and what each adapter calls:

- npm `fengari`: `lualib.luaL_openlibs` on `lauxlib.luaL_newstate()`, then
  `lauxlib.luaL_dostring(L, to_luastring(script))` and the value on top of the
  stack, read back as a number or with `to_jsstring`.
- crate `mlua`: `Lua::new().load(script).eval::<Value>()`, with Lua 5.4
  vendored (built from source into the binary, no system Lua).
- crate `piccolo`: `Lua::core()`, the chunk compiled and run on an `Executor`,
  and the value it returns.
- Go `github.com/yuin/gopher-lua`: `lua.NewState()`, `L.DoString(script)`,
  `L.Get(-1)`, `L.Close()`.

There is no standard-library entry: no language here ships a Lua interpreter.

Left out: Starlark (`go.starlark.net`, crate `starlark`), which is another
guest language with only two candidates and belongs in a task of its own.
