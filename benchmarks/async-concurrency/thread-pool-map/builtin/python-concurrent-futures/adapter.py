from concurrent.futures import ThreadPoolExecutor


def job(seed, rounds):
    x = seed
    for _ in range(rounds):
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
    return x


def operation(value):
    with ThreadPoolExecutor(max_workers=value["threads"]) as pool:
        return list(pool.map(job, value["seeds"], value["rounds"]))
