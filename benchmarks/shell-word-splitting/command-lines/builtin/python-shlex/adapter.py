import shlex

def operation(value):
    return shlex.split(value['line'])
