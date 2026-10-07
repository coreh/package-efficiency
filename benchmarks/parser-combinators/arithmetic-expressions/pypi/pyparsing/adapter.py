import pyparsing as pp


def _fold(tokens):
    t = tokens[0]
    result = t[0]
    for i in range(1, len(t), 2):
        op, rhs = t[i], t[i + 1]
        if op == '+':
            result = result + rhs
        elif op == '-':
            result = result - rhs
        elif op == '*':
            result = result * rhs
        else:
            result = result / rhs
    return result


number = pp.Regex(r'[0-9]+(?:\.[0-9]+)?').set_parse_action(lambda t: float(t[0]))
expr = pp.infix_notation(number, [
    (pp.Literal('-'), 1, pp.OpAssoc.RIGHT, lambda t: -t[0][1]),
    (pp.one_of('* /'), 2, pp.OpAssoc.LEFT, _fold),
    (pp.one_of('+ -'), 2, pp.OpAssoc.LEFT, _fold),
])


def operation(text):
    return expr.parse_string(text, parse_all=True)[0]
