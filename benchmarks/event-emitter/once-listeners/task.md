# One-shot listeners that re-arm

One operation builds a fresh emitter and, for each of N event names (1 to 8),
registers 3 persistent listeners (`on`) and 3 one-shot listeners (`once`).
Listener `j` (0 to 5; even are persistent, odd are one-shot) adds
`a * (j + 1) - b` to a shared total. It emits the first half of a stream of
events, each carrying two integer arguments `a` and `b`, registers another set of
3 one-shot listeners on every name (a set that never fired stays, so a name may
hold 6 one-shot listeners and 9 in all, within the common limit of ten), and emits the second half. Some events name a
string nobody listens to. There are 32 fixtures with 100 to 200 events each:
uniform, skewed, cyclic and sparse mixes over 1 to 8 names.

A correct output is the exact integer total from an independent reference. It
depends on one-shot listeners running exactly once, on the first emit for their
name after being armed, on persistent listeners running every time, and on the
second registration re-arming them. A package that ignores `once` (running
them every time) or drops them without running gives a different total.
Listener call order does not change the sum, so it is not checked.

Packages run with their default settings as installed. Listeners are closures
created inside the measured call, as is the emitter, so construction,
registration, dispatch and the automatic removal of one-shot listeners are all
timed in every adapter alike.

Packages without a `once` method (such as `@protobufjs/eventemitter`) are left
out: emulating it with a wrapper would be work done by the adapter, not the
package.

`@denosaurs/event` declares `emit` as `async`. Its listener work runs
synchronously before the first `await`, so every listener has run when the call
returns; the returned promises are ignored.

See [shared methodology](../../README.md) for timing and reproduction.
