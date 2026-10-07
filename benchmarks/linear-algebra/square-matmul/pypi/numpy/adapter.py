import numpy as np

def operation(value):
    n = value["n"]
    a = np.array(value["a"], dtype=np.float64).reshape(n, n)
    b = np.array(value["b"], dtype=np.float64).reshape(n, n)
    return a @ b

def describe(result):
    return result.ravel().tolist()
