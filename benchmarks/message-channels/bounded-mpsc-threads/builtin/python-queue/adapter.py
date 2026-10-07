import queue
import threading


def operation(value):
    producers, messages = value["producers"], value["messages"]
    channel = queue.Queue(value["capacity"])

    def produce(p):
        put = channel.put
        for i in range(messages):
            put(i * producers + p)

    threads = [threading.Thread(target=produce, args=(p,)) for p in range(producers)]
    for thread in threads:
        thread.start()
    following = [0] * producers
    count = total = 0
    ordered = True
    get = channel.get
    for _ in range(producers * messages):
        v = get()
        p = v % producers
        if v // producers != following[p]:
            ordered = False
        following[p] += 1
        total += v
        count += 1
    for thread in threads:
        thread.join()
    return {"count": count, "sum": total, "ordered": ordered}
