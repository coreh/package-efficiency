import lxml.html
from lxml.cssselect import CSSSelector

_parsed = {}

# Not timed: the document is parsed once (shared between fixtures).
def prepare(input):
    html = input["html"]
    if html not in _parsed:
        _parsed[html] = lxml.html.fromstring(html)
    return (_parsed[html], input["selector"])

def operation(prepared):
    root, selector = prepared
    return CSSSelector(selector)(root)

def describe(result):
    return [int(e.get("data-n")) for e in result]
