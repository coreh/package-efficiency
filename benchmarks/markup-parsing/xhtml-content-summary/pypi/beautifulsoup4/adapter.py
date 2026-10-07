from bs4 import BeautifulSoup

def non_space(s):
    return len(s) - s.count(" ") - s.count("\t") - s.count("\n") - s.count("\r")

def operation(value):
    soup = BeautifulSoup(value, 'html.parser')
    elements = attributes = text = 0
    for tag in soup.find_all(True):
        elements += 1
        for v in tag.attrs.values():
            attributes += len(' '.join(v) if isinstance(v, list) else v)
    for s in soup.strings:
        text += non_space(s)
    return {'elements': elements, 'attributes': attributes, 'text': text}
