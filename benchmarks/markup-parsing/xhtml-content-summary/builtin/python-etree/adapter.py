import xml.etree.ElementTree as ET

# Code points other than space, tab, line feed and carriage return.
def non_space(s):
    return len(s) - s.count(' ') - s.count('\t') - s.count('\n') - s.count('\r')

def operation(value):
    elements = attributes = text = 0
    for element in ET.fromstring(value).iter():
        elements += 1
        for v in element.attrib.values():
            attributes += len(v)
        if element.text:
            text += non_space(element.text)
        if element.tail:
            text += non_space(element.tail)
    return {'elements': elements, 'attributes': attributes, 'text': text}
