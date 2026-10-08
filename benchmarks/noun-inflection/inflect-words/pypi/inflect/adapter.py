import inflect

_engine = inflect.engine()

def operation(words):
    plural = _engine.plural_noun
    singular = _engine.singular_noun
    out = []
    for word in words:
        p = plural(word)
        out.append(p)
        # singular_noun returns False when the word is already singular
        out.append(singular(p) or p)
    return out
