import sys
import types
import ply.lex as lex
import ply.yacc as yacc

if __name__ not in sys.modules:  # the runner does not register the adapter module; ply's inspect calls need it
    _self = types.ModuleType(__name__)
    _self.__file__ = __file__
    sys.modules[__name__] = _self

tokens = ('NUMBER', 'PLUS', 'MINUS', 'TIMES', 'DIVIDE', 'LPAREN', 'RPAREN')

t_PLUS = r'\+'
t_MINUS = r'-'
t_TIMES = r'\*'
t_DIVIDE = r'/'
t_LPAREN = r'\('
t_RPAREN = r'\)'
t_ignore = ' \t'

precedence = (
    ('left', 'PLUS', 'MINUS'),
    ('left', 'TIMES', 'DIVIDE'),
    ('right', 'UMINUS'),
)


def t_NUMBER(t):
    r'[0-9]+(?:\.[0-9]+)?'
    t.value = float(t.value)
    return t


def t_error(t):
    raise ValueError('illegal character %r' % t.value[0])


def p_binop(p):
    '''expr : expr PLUS expr
            | expr MINUS expr
            | expr TIMES expr
            | expr DIVIDE expr'''
    op = p[2]
    if op == '+':
        p[0] = p[1] + p[3]
    elif op == '-':
        p[0] = p[1] - p[3]
    elif op == '*':
        p[0] = p[1] * p[3]
    else:
        p[0] = p[1] / p[3]


def p_uminus(p):
    'expr : MINUS expr %prec UMINUS'
    p[0] = -p[2]


def p_group(p):
    'expr : LPAREN expr RPAREN'
    p[0] = p[2]


def p_number(p):
    'expr : NUMBER'
    p[0] = p[1]


def p_error(p):
    raise ValueError('syntax error at %r' % (p,))


lexer = lex.lex()
parser = yacc.yacc(start='expr', write_tables=False, debug=False, errorlog=yacc.NullLogger())


def operation(text):
    return parser.parse(text, lexer=lexer)
