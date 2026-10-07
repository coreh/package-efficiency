from lark import Lark, Transformer

grammar = r'''
?start: sum
?sum: product
    | sum "+" product -> add
    | sum "-" product -> sub
?product: unary
    | product "*" unary -> mul
    | product "/" unary -> div
?unary: "-" unary -> neg
    | atom
?atom: NUMBER -> number
    | "(" sum ")"
NUMBER: /[0-9]+(?:\.[0-9]+)?/
%ignore /[ \t]+/
'''


class Evaluate(Transformer):
    def number(self, items):
        return float(items[0])

    def add(self, items):
        return items[0] + items[1]

    def sub(self, items):
        return items[0] - items[1]

    def mul(self, items):
        return items[0] * items[1]

    def div(self, items):
        return items[0] / items[1]

    def neg(self, items):
        return -items[0]


parser = Lark(grammar, start='start', parser='lalr')
evaluator = Evaluate()


def operation(text):
    return evaluator.transform(parser.parse(text))
