from cachetools import LRUCache

def operation(input):
    cache = LRUCache(maxsize=input["capacity"])
    hits = total = removed = 0
    for i, key in enumerate(input["keys"]):
        if i % 11 == 10:
            if cache.pop(key, None) is not None:
                removed += 1
        else:
            value = cache.get(key)
            if value is not None:
                hits += 1
                total += value
            else:
                cache[key] = i
    return [hits, total, removed, len(cache)]
