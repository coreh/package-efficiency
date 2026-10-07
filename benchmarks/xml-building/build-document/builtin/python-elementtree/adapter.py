import xml.etree.ElementTree as ET

def add(parent, node):
    element = ET.SubElement(parent, node['name'], node['attrs'])
    if 'children' in node:
        for child in node['children']:
            add(element, child)
    else:
        element.text = node['text']

def operation(doc):
    root = ET.Element(doc['name'], doc['attrs'])
    for child in doc['children']:
        add(root, child)
    return ET.tostring(root, encoding='unicode')
