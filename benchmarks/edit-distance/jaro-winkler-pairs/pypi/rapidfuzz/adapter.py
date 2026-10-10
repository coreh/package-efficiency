from rapidfuzz.distance import JaroWinkler
def operation(value):
    similarity = JaroWinkler.similarity
    return [similarity(pair[0], pair[1]) for pair in value]
