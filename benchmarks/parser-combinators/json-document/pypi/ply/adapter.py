import re
import ply.lex as lex
import ply.yacc as yacc

tokens = ('LBRACE', 'RBRACE', 'LBRACKET', 'RBRACKET', 'COMMA', 'COLON', 'STRING', 'NUMBER', 'TRUE', 'FALSE', 'NULL')

t_LBRACE = r'\{'
t_RBRACE = r'\}'
t_LBRACKET = r'\['
t_RBRACKET = r'\]'
t_COMMA = r','
t_COLON = r':'
t_TRUE = r'true'
t_FALSE = r'false'
t_NULL = r'null'
t_ignore = ' \t\r\n'

_ESC = re.compile(r'\\(?:u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})|u([0-9a-fA-F]{4})|(.))')
_SIMPLE = {'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t'}


def _unescape_one(m):
    hi, lo, bmp, ch = m.groups()
    if hi:
        return chr(0x10000 + ((int(hi, 16) - 0xD800) << 10) + (int(lo, 16) - 0xDC00))
    if bmp:
        return chr(int(bmp, 16))
    return _SIMPLE.get(ch, ch)


def t_STRING(t):
    r'"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"'
    body = t.value[1:-1]
    t.value = body if '\\' not in body else _ESC.sub(_unescape_one, body)
    return t


def t_NUMBER(t):
    r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?'
    text = t.value
    t.value = float(text) if ('.' in text or 'e' in text or 'E' in text) else int(text)
    return t


def t_error(t):
    raise ValueError('illegal character %r' % t.value[0])


def p_value(p):
    '''value : STRING
             | NUMBER
             | object
             | array'''
    p[0] = p[1]


def p_true(p):
    'value : TRUE'
    p[0] = True


def p_false(p):
    'value : FALSE'
    p[0] = False


def p_null(p):
    'value : NULL'
    p[0] = None


def p_object(p):
    '''object : LBRACE RBRACE
              | LBRACE members RBRACE'''
    p[0] = {} if len(p) == 3 else dict(p[2])


def p_members_one(p):
    'members : STRING COLON value'
    p[0] = [(p[1], p[3])]


def p_members_more(p):
    'members : members COMMA STRING COLON value'
    p[1].append((p[3], p[5]))
    p[0] = p[1]


def p_array(p):
    '''array : LBRACKET RBRACKET
             | LBRACKET elements RBRACKET'''
    p[0] = [] if len(p) == 3 else p[2]


def p_elements_one(p):
    'elements : value'
    p[0] = [p[1]]


def p_elements_more(p):
    'elements : elements COMMA value'
    p[1].append(p[3])
    p[0] = p[1]


def p_error(p):
    raise ValueError('syntax error at %r' % (p,))


lexer = lex.lex()
parser = yacc.yacc(start='value', write_tables=False, debug=False, errorlog=yacc.NullLogger())


def operation(text):
    return parser.parse(text, lexer=lexer)
