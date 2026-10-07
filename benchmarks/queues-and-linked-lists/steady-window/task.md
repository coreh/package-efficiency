# Steady-length FIFO window

An input is a pair `[window, items]`: a window size and a list of integers.
One operation creates an empty queue from the package, then for each item pushes
it to the back and, whenever the queue holds more than `window` items, pops one
from the front and appends it to the output list. When all items are pushed the
queue's length is read once, the queue is drained from the front into the
output, and that length is appended as the last element. The output is the list
of popped integers, in pop order, followed by the number of items the queue held
before the drain.

A correct output is exactly the input list followed by that held count, which
the fixture generator computes without a queue (the smaller of the window and
the list length). A FIFO queue returns items in the order they were pushed; a
stack or any reordering fails, and so does returning the input unchanged or a
queue that never releases items while filling. The 40 fixtures vary the
length (0 to 1200 items), the window (1 to 256, including windows larger than the
list so nothing is popped until the drain) and the values (small, large, negative,
repeated).

The queue is created inside the measured call, so construction is timed in every
language. The queue's own length/size accessor decides when to pop, and the
output list is a native array/list/Vec of the language, grown from empty in
every adapter. Packages run with default
settings as installed. Nothing is cached between calls.

Packages that are stacks, work-stealing deques or concurrent channels are used
only through their single-threaded FIFO operations. `crossbeam-deque` is not a
general-purpose queue: it is a work-stealing concurrency primitive, built so
that other threads can steal from the queue's far end, and it is measured here
as a single-threaded queue, a job it was not designed for. The adapter uses
`Worker::new_fifo` with `push`, `pop` and `len`; its atomics are part of what it
costs, and its figure says nothing about its work-stealing use. Standard-library baselines: JavaScript `Array` (`push`/`shift`), Python
`collections.deque`, Ruby `Array` (`push`/`shift`), Go `container/list`.
JSR `@cm-iv/stack` is a stack with no queue operations and is left out.
