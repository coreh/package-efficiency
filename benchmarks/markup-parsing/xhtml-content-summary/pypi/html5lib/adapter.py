import html5lib

def non_space(s):
    return len(s) - s.count(" ") - s.count("\t") - s.count("\n") - s.count("\r")

def operation(value):
    elements = attributes = text = 0
    for node in html5lib.parse(value).iter():
        if isinstance(node.tag, str):
            elements += 1
            for v in node.attrib.values():
                attributes += len(v)
            if node.text:
                text += non_space(node.text)
        # A comment's own text is not character data; the text after any node is.
        if node.tail:
            text += non_space(node.tail)
    return {'elements': elements, 'attributes': attributes, 'text': text}
