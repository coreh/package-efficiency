from joblib import Parallel, delayed


def job(seed, rounds):
    x = seed
    for _ in range(rounds):
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
    return x


def operation(value):
    return Parallel(n_jobs=value["threads"], prefer="threads")(
        delayed(job)(s, r) for s, r in zip(value["seeds"], value["rounds"])
    )
