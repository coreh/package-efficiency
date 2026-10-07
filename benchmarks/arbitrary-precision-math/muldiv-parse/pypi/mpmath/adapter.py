from mpmath import mp, mpf, floor, nstr

def fmt(v):
    s = nstr(v, 5000, min_fixed=float('-inf'), max_fixed=float('inf'))
    return s[:-2] if s.endswith('.0') else s

def operation(pair):
    x = mpf(pair[0])
    y = mpf(pair[1])
    q = floor(x / y)
    return [fmt(x * y), fmt(q), fmt(x - q * y)]
