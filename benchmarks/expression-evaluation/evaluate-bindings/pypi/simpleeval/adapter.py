from simpleeval import SimpleEval

FUNCTIONS = {"abs": abs, "min": min, "max": max}

def operation(value):
    expr = value["expr"]
    evaluator = SimpleEval(functions=FUNCTIONS)
    tree = evaluator.parse(expr)
    out = []
    for names in value["vars"]:
        evaluator.names = names
        out.append(evaluator.eval(expr, previously_parsed=tree))
    return out
