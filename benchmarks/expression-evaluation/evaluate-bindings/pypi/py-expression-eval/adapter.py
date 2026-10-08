from py_expression_eval import Parser

parser = Parser()

def operation(value):
    parsed = parser.parse(value["expr"])
    return [parsed.evaluate(names) for names in value["vars"]]
