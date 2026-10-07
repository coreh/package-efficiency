def operation(value):
    text = value["text"]
    return [text.count(n) for n in value["needles"]]
