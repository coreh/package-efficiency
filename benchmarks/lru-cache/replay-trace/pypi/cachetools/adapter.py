from cachetools import LRUCache

def operation(input):
    cache = LRUCache(maxsize=input["capacity"])
    hits = 0
    for key in input["keys"]:
        if cache.get(key) is not None:
            hits += 1
        else:
            cache[key] = 1
    return hits
