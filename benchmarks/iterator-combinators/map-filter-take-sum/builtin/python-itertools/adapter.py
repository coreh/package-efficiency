from itertools import islice

def _map(x):
    return x * 3 + 1

def _keep(x):
    return x % 5 != 0

def operation(value):
    data, limit = value
    return sum(islice(filter(_keep, map(_map, data)), limit))
