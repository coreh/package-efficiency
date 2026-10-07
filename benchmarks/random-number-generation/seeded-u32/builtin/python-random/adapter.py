import random

def operation(value):
    getbits = random.Random(value['seed']).getrandbits
    return [getbits(32) for _ in range(value['count'])]
