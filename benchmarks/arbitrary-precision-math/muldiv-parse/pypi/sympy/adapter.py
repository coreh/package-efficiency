from sympy import Integer

def operation(pair):
    x = Integer(pair[0])
    y = Integer(pair[1])
    q, r = divmod(x, y)
    return [str(x * y), str(q), str(r)]
