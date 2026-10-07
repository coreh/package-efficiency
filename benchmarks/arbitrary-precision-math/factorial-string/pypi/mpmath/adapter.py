from mpmath import mp, mpf, nstr

def operation(n):
    r = mpf(1)
    for i in range(2, n + 1):
        r *= i
    s = nstr(r, 3000, min_fixed=float('-inf'), max_fixed=float('inf'))
    return s[:-2] if s.endswith('.0') else s
