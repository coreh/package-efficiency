from bs4 import BeautifulSoup
import soupsieve

_parsed = {}

# Not timed: the document is parsed once (shared between fixtures).
def prepare(input):
    html = input["html"]
    if html not in _parsed:
        _parsed[html] = BeautifulSoup(html, "html.parser")
    return (_parsed[html], input["selector"])

def operation(prepared):
    document, selector = prepared
    return soupsieve.select(selector, document)

def describe(result):
    return [int(e["data-n"]) for e in result]
