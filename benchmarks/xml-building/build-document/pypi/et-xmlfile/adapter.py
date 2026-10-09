import io
from et_xmlfile import xmlfile

def add(xf, node):
    if 'children' in node:
        with xf.element(node['name'], node['attrs']):
            for child in node['children']:
                add(xf, child)
    else:
        with xf.element(node['name'], node['attrs']):
            xf.write(node['text'])

def operation(doc):
    out = io.BytesIO()
    with xmlfile(out, encoding='utf-8') as xf:
        add(xf, doc)
    return out.getvalue().decode('utf-8')
