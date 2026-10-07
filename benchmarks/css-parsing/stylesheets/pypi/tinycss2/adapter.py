from typing import Any

import tinycss2

_FIELDS = ('name', 'value', 'int_value', 'representation', 'unit')
_CHILDREN = ('prelude', 'content', 'arguments')


def operation(css):
    return tinycss2.parse_stylesheet(css)


def _node(n):
    out: dict[str, Any] = {'type': type(n).__name__}
    for f in _FIELDS:
        v = getattr(n, f, None)
        if v is not None:
            out[f] = v
    for f in _CHILDREN:
        v = getattr(n, f, None)
        if v is not None:
            out[f] = [_node(c) for c in v]
    return out


def describe(result):
    rules = [_node(n) for n in result if n.type not in ('comment', 'whitespace')]
    return {'type': 'stylesheet', 'stylesheet': {'rules': rules}, 'rules': rules}
