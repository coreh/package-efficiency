import inflection

def operation(words):
    out = []
    for word in words:
        p = inflection.pluralize(word)
        out.append(p)
        out.append(inflection.singularize(p))
    return out
