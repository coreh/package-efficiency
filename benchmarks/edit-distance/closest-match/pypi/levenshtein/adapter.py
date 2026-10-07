import Levenshtein
def operation(value):
    query, words = value
    best = 0
    best_distance = None
    for i, w in enumerate(words):
        d = Levenshtein.distance(query, w)
        if best_distance is None or d < best_distance:
            best_distance = d
            best = i
    return best
