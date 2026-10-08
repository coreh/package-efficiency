# Class graph round trip

One operation takes a live graph of 2,000 `Node` instances (plus `Group`
instances and tag lists) and returns the graph restored from its serialized
form: serialize, then restore, in one call. The adapter returns the restored
graph, whatever the library returns; only the length-or-one is read by the
timed loop.

The graph is built from the fixture in `prepare` (not timed). Each node has an
id, a name (some non-ASCII), a float score, a tuple position, a tag list, a
group, a parent and a list of children, and one node in seven refers to itself.
Parent and children point at each other, so the graph is full of cycles. 25
`Group` objects and 40 tag lists are each shared by many nodes, and a group
points back at a node (its lead). Three fixtures, all 2,000 nodes: a binary
tree, a ternary tree and a random recursive tree. The classes live in an
importable module (registered in `sys.modules` by the adapter, because the
adapter file itself is not importable by name), as application classes do, so
every library stores them by reference.

## What counts as correct

The untimed `describe` step walks the restored graph and reports, for each node,
the class name, the field values, the type of the position (a tuple must stay a
tuple), and the identity of every reference as an index into the restored
graph's own lists: the tag list, the group, the parent, the children, whether
the node refers to itself, and each group's lead. The scenario compares this
with what it knows from the fixture, exactly. A library that copies a shared
group per node, breaks a cycle, turns a tuple into a list, or restores plain
dicts instead of instances fails. `describe` also reports that the nodes, groups
and tag lists are distinct objects, and that the result is not the input graph.
The last check is by identity against the graphs `prepare` built, so returning
the input fails; it is a guard inside the adapter's untimed code, not a proof
that the timed call serialized anything.

No difference in output is accepted other than the library's own format, which
is not compared (binary pickle, JSON text).

## Scope

Python only: no other ecosystem here serializes arbitrary live class instances
with shared references and cycles through a comparable default API, so there are
no adapters in other languages. `tblib` (tracebacks only) is left out: another
job. Restoring functions and closures is a separate task. Every entry uses
default options. `cloudpickle` is restored with the standard `pickle.loads`, as
its documentation shows; `dill` and `jsonpickle` use their own loaders. Formats
differ in work done (JSON text against binary pickle), which is reported, not
hidden. `cloudpickle` does not run on PyPy (its pickler needs CPython's C
`Pickler.dispatch`).
