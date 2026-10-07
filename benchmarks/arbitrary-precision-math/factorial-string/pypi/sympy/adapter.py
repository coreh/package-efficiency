from sympy import Integer

def operation(n):
    r = Integer(1)
    for i in range(2, n + 1):
        r *= i
    return str(r)
