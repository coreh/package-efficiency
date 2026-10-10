import numpy as np

# Untimed, once per fixture: the 64 row-major arrays become one (64, 4, 4) float64 array.
def prepare(value):
    return np.array(value["matrices"], dtype=np.float64).reshape(64, 4, 4)

def operation(ms):
    product = np.linalg.multi_dot(list(ms))
    return product, np.linalg.inv(product)

def describe(result):
    p, inv = result
    return [p.ravel().tolist(), inv.ravel().tolist()]
