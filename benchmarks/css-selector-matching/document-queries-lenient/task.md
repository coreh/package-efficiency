# Selector queries on a parsed document, lenient

The lenient form of [document-queries](../document-queries/task.md), which is
the strict task. One operation is the same: it compiles a CSS selector string
and returns every element of an already parsed HTML document that it matches,
in document order. The entries are the adapters of the strict task, unchanged;
this folder has none of its own (`"adaptersFrom"` in `task.json`).

The strict task says which libraries read the selectors of today, Level 4
included. This one compares the cost of matching among all the libraries that
implement Selectors Level 3 correctly.

## What differs from the strict task

Two of the strict task's 44 selectors are left out, so there are 42:

- `:is(h2, h3) + p`
- `[data-kind="NOTE" i]`

Both are syntax that Selectors Level 4 added. The rule is the level, not the
two selectors: the scenario leaves out any selector with `:is()`, `:where()`,
`:has()`, a `:not()` holding a selector list or a combinator, or the case flag
of an attribute selector, and asserts when it loads that this removes exactly
these two.

They are removed, not forgiven in the check, because a library written to
Level 3 does not answer them: it refuses to compile the selector. cascadia
panics with "unknown pseudoclass"; goquery, which compiles with cascadia,
matches nothing when a selector does not compile; cssselect raises
`SelectorSyntaxError`. An error is not a result that a check could accept,
and an entry that stops at compiling a selector does not do the work that is
timed.

The other 42 fixtures are the strict task's own, in the same order, with the
same document: type, class, id, every Level 3 attribute operator, the four
combinators, the structural pseudo-classes, `:empty`, `:not()` with a simple
selector, selector lists, the universal selector and a selector that matches
nothing.

## Correct output

Exactly as in the strict task, and nothing is forgiven: the list of matching
elements, compared by their `data-n` numbers, in document order, with an
independent reference. A missing, extra or misplaced element fails. An empty
list, every element, and another fixture's matches are rejected when the
scenario loads.

## Entries that pass only here

Each has its reason in its adapter's notes, in the strict task's folder:

- `andybalholm/cascadia` and `PuerkitoBio/goquery` (which uses cascadia): no
  `:is()`.
- `cssselect`: no case flag in an attribute selector.

See [shared methodology](../../README.md) for timing and reproduction, and
"Strict and lenient tasks" there for the rules of such a pair.
