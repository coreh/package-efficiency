# Register listeners and emit events

One operation builds a fresh emitter, registers 10 listeners on each of N event
names (1 to 8 names), emits the first half of a stream of events, removes two of
the ten listeners from every name (the first and the sixth registered), emits
the second half, and returns the sum the listeners accumulated. Each event
carries two integer arguments, `a` and `b`. Listener `j` (0 to 9) adds
`a * (j + 1) - b` to the shared total. Some events name a string nobody listens
to. There are 36 fixtures with 120 to 240 events each, from a single hot name to
skewed and uniform mixes over eight names.

A correct output is the exact integer total from an independent reference that
uses plain arrays. It depends on every registered listener running for every
matching event, on `off` removing only the listener it is given, and on emits
for names without listeners doing nothing. Listener call order does not change
the sum, so it is not checked.

Packages run with their default settings as installed: no listener limits are
changed (ten per name stays within the common default), and no wildcard,
`once`, context-binding or async features are used. Listeners are closures
created inside the measured call, as is the emitter, so construction,
registration, removal and dispatch are all timed in every adapter alike.

Packages whose design is a single-event emitter (no event names) or whose
listeners take one value only are left out, since they cannot do this work
without being bent into a different shape.

`@denosaurs/event` declares `emit` and `off` as `async`. Their listener work
runs synchronously before the first `await`, so by the time the call returns
every listener has run; the returned promises are ignored, and the cost of
creating them is part of what that library does.

See [shared methodology](../../README.md) for timing and reproduction.
