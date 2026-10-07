import html5lib
import cssselect2

_parsed = {}

# Not timed: the document is parsed once (shared between fixtures).
def prepare(input):
    html = input["html"]
    if html not in _parsed:
        root = html5lib.parse(html, namespaceHTMLElements=False)
        _parsed[html] = cssselect2.ElementWrapper.from_html_root(root)
    return (_parsed[html], input["selector"])

def operation(prepared):
    wrapper, selector = prepared
    return wrapper.query_all(selector)

def describe(result):
    return [int(e.etree_element.get("data-n")) for e in result]
