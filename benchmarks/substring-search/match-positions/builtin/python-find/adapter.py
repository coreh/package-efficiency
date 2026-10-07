def operation(value):
    text = value["text"]
    needle = value["needle"]
    out = []
    i = text.find(needle)
    while i != -1:
        out.append(i)
        i = text.find(needle, i + len(needle))
    return out
