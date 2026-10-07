# Class name composition from mixed arguments

One operation takes a list of ten arguments and returns one class string. Each
argument is a string (possibly holding several classes), a nested array, an
object mapping class names to conditions, or a falsy value (`null`, `undefined`,
`false`, empty string) that must be skipped. Objects contribute the keys whose
value is truthy, in key order; arrays are flattened depth first; pieces are
joined with single spaces.

The 48 fixtures are built deterministically from component, state and layout
class vocabularies, with varied nesting depth, condition values and number of
falsy arguments. Outputs must equal an independent reference exactly: same
classes, same order, no leading, trailing or doubled spaces. No de-duplication
or conflict resolution is expected (that is out of scope), and numbers are not
used as arguments because packages differ on them.

Each adapter spreads the argument list into the package's function (`clsx(...args)`,
`cx(...args)`), with default settings. `class-variance-authority` is called
through its `cx` export, the part of it that composes class names; its variant
(`cva`) feature is a different job and is not measured. That `cx` is `clsx`
itself, re-exported unchanged (`export const cx = clsx`), so the
`class-variance-authority` and `clsx` entries run the same function and should
rank together; the real comparison is between `clsx` and `@nick/clsx`, a
separate implementation. `tailwind-merge`, also in this category, has no entry:
its `twMerge` resolves conflicts between Tailwind classes, a different job, and
its plain joiner `twJoin` does not accept the object arguments these fixtures
use. There is no builtin or
Rust entry: neither the JavaScript, Python, Ruby nor Go standard library nor the
brief's crates offer this operation. The argument spread is part of every
measured call alike.

See [shared methodology](../../README.md) for timing and reproduction.
