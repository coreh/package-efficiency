import random

def operation(value):
    randint = random.Random(value['seed']).randint
    lo = value['min']
    hi = value['max']
    return [randint(lo, hi) for _ in range(value['count'])]
