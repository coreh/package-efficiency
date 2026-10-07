import numpy as np

def operation(value):
    n = value["n"]
    a = np.array(value["a"], dtype=np.float64).reshape(n, n)
    return np.linalg.inv(a)

def describe(result):
    return result.ravel().tolist()
