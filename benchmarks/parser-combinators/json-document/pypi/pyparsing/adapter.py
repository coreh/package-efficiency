import re
import pyparsing as pp

_ESC = re.compile(r'\\(?:u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})|u([0-9a-fA-F]{4})|(.))')
_SIMPLE = {'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t'}


def _unescape_one(m):
    hi, lo, bmp, ch = m.groups()
    if hi:
        return chr(0x10000 + ((int(hi, 16) - 0xD800) << 10) + (int(lo, 16) - 0xDC00))
    if bmp:
        return chr(int(bmp, 16))
    return _SIMPLE.get(ch, ch)


def _string(tokens):
    body = tokens[0][1:-1]
    return body if '\\' not in body else _ESC.sub(_unescape_one, body)


def _number(tokens):
    text = tokens[0]
    if '.' in text or 'e' in text or 'E' in text:
        return float(text)
    return int(text)


LBRACE, RBRACE, LBRACKET, RBRACKET, COMMA, COLON = map(pp.Suppress, '{}[],:')
value = pp.Forward()
string = pp.Regex(r'"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"').set_parse_action(_string)
number = pp.Regex(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?').set_parse_action(_number)
true = pp.Literal('true').set_parse_action(lambda t: [True])
false = pp.Literal('false').set_parse_action(lambda t: [False])
null = pp.Literal('null').set_parse_action(lambda t: [None])
member = pp.Group(string + COLON + value)
obj = (LBRACE + pp.Optional(member + pp.ZeroOrMore(COMMA + member)) + RBRACE).set_parse_action(
    lambda t: [{k: v for k, v in t}])
array = (LBRACKET + pp.Optional(value + pp.ZeroOrMore(COMMA + value)) + RBRACKET).set_parse_action(
    lambda t: [t.as_list()])
value <<= string | number | obj | array | true | false | null


def operation(text):
    return value.parse_string(text, parse_all=True)[0]
