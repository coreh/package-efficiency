from rapidfuzz.distance import Levenshtein
def operation(value):
    return Levenshtein.distance(value[0], value[1])
