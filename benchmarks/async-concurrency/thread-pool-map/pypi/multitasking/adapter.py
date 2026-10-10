import multitasking


def job(seed, rounds):
    x = seed
    for _ in range(rounds):
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
    return x


def operation(value):
    multitasking.set_max_threads(value["threads"])
    seeds, rounds = value["seeds"], value["rounds"]
    results = [0] * len(seeds)

    def work(i):
        results[i] = job(seeds[i], rounds[i])

    run = multitasking.task(work)  # the decorator, applied by call

    for i in range(len(seeds)):
        run(i)
    multitasking.wait_for_tasks()
    return results
