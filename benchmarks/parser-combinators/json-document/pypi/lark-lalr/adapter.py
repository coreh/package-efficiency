import re
from lark import Lark, Transformer

grammar = r'''
?start: value
?value: object
      | array
      | STRING -> string
      | NUMBER -> number
      | "true" -> true
      | "false" -> false
      | "null" -> null
array: "[" [value ("," value)*] "]"
object: "{" [pair ("," pair)*] "}"
pair: STRING ":" value
STRING: /"(?:[^"\\\x00-\x1f]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*"/
NUMBER: /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/
%ignore /[ \t\r\n]+/
'''

_ESC = re.compile(r'\\(?:u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})|u([0-9a-fA-F]{4})|(.))')
_SIMPLE = {'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t'}


def _unescape_one(m):
    hi, lo, bmp, ch = m.groups()
    if hi:
        return chr(0x10000 + ((int(hi, 16) - 0xD800) << 10) + (int(lo, 16) - 0xDC00))
    if bmp:
        return chr(int(bmp, 16))
    return _SIMPLE.get(ch, ch)


class ToValue(Transformer):
    def string(self, items):
        body = items[0][1:-1]
        return body if '\\' not in body else _ESC.sub(_unescape_one, body)

    def number(self, items):
        text = str(items[0])
        if '.' in text or 'e' in text or 'E' in text:
            return float(text)
        return int(text)

    def true(self, items):
        return True

    def false(self, items):
        return False

    def null(self, items):
        return None

    def array(self, items):
        return [] if items == [None] else items

    def pair(self, items):
        return (items[0], items[1])

    def object(self, items):
        return {} if items == [None] else dict(items)


parser = Lark(grammar, start='start', parser='lalr')
transformer = ToValue()


def operation(text):
    return transformer.transform(parser.parse(text))
