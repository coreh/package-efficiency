from asteval import Interpreter

interpreter = Interpreter()

def operation(value):
    tree = interpreter.parse(value["expr"])
    out = []
    for names in value["vars"]:
        interpreter.symtable.update(names)
        out.append(interpreter.run(tree))
    return out

# With NumPy installed the interpreter returns NumPy bool scalars for comparisons.
def describe(result):
    return [x if isinstance(x, (int, float)) else bool(x) for x in result]
