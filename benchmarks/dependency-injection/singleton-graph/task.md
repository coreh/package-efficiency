# Singleton service graph

One operation creates a new container, registers every service of a graph, then
resolves the root service, which makes the container build all of its transitive
dependencies. Each of the 37 fixtures is a layered graph of 1 to 289 services
(layers of 1 to 16 services; a service depends on one to three services of the
layer below, and the root depends on the whole top layer), so shapes range from a
long chain to a wide shared diamond lattice.

A service is registered by a factory that asks the container for each of its
dependencies and returns a plain object `{ id, deps }` where `deps` holds the
dependency instances in declaration order. Services are singletons: asking for
the same service twice gives the same object. The container is created inside the
call, so registration, construction and lookup are all timed, and nothing is
kept between calls.

A correct result is the root instance. The checker (not timed) walks it and
requires: every `id` and `deps` list equal to the definition, one object per
service id across the whole graph (the singleton guarantee), and every
service of the fixture reachable from the root.

Both packages are used with default settings. Differences accepted as equivalent:

- `@needle-di/core` builds services lazily when the root is requested;
  `@fathym/ioc` runs a registered factory immediately, so services are
  registered in dependency order (the fixtures are already in that order). The
  total work, building each service once, is the same.
- Transient lifetimes are not part of the task: `@needle-di/core` has none, so
  the common behavior is singleton.
- `@fathym/ioc` resolves with `ResolveDirect` (synchronous); its `Resolve` is
  asynchronous and outside this synchronous task.

Packages from PyPI, RubyGems and Go modules are not part of this task.
Compile-time code generators and decorator-driven frameworks are out of scope.
See [shared methodology](../../README.md) for timing and reproduction.
