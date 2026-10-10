import Levenshtein
def operation(value):
    jaro_winkler = Levenshtein.jaro_winkler
    return [jaro_winkler(pair[0], pair[1]) for pair in value]
