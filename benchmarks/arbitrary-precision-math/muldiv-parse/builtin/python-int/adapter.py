def operation(pair):
    x = int(pair[0])
    y = int(pair[1])
    q, r = divmod(x, y)
    return [str(x * y), str(q), str(r)]
