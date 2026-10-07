import threading


def operation(value):
    turns = value["turns"]
    lock = threading.Lock()
    counter = [0]
    sums = [0] * value["threads"]

    def work(n):
        mine = 0
        for _ in range(turns):
            with lock:
                ticket = counter[0]
                counter[0] = ticket + 1
            mine += ticket
        sums[n] = mine

    threads = [threading.Thread(target=work, args=(n,)) for n in range(value["threads"])]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    return {"count": counter[0], "sum": sum(sums)}
