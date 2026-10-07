# Double-ended queue script

An input is a list of non-negative integers, each one an instruction. The
instruction's low two bits (`x & 3`) pick the operation and the integer itself
is the value: 0 pushes `x` to the back, 1 pushes `x` to the front, 2 pops from
the front, 3 pops from the back. A pop on an empty deque does nothing. Every
popped value is appended to the output. After the last instruction, the output
gets `-1` and then the remaining items drained from the front, front to back.

A correct output is the popped values in order, `-1`, then the remaining items in
deque order. The fixture generator computes it with a plain array, outside any
package. A FIFO-only queue, a stack, or an implementation that ignores the
front pushes gives the wrong order, and so does returning the input or a
constant. The 36 fixtures vary the length (0 to 1500 instructions), the mix
(push-heavy, balanced, pop-heavy, front-heavy, back-heavy) and the values.

The deque is created inside the measured call, in every language. The deque's
own length or emptiness check decides whether a pop happens, and the output is
a native array/list/Vec grown from empty in every adapter. Packages run with
default settings as installed. Nothing is cached between calls.

This is a different job from `steady-window` (FIFO only at one end each): it
needs both ends, so packages that are queues only are left out. `yocto-queue`
has no front push or back pop, `crossbeam-deque` has no back pop on its FIFO
worker, and JSR `@cm-iv/stack` has no front operations; none is used.
Standard-library baselines: JavaScript `Array` (`push`/`unshift`/`shift`/`pop`,
where `unshift` and `shift` move elements), Python `collections.deque`, Ruby
`Array`, Go `container/list`. `dlv-list` `VecList` is a vector-backed linked list.
