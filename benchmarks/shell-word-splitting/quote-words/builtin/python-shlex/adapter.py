import shlex

def operation(value):
    return shlex.join(value['words'])
