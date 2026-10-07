from asn1crypto import parser

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def _walk(data, out):
    # parser.parse returns (class, method, tag, header, content, trailer); method 1 is constructed.
    while data:
        cls, method, tag, header, content, trailer = parser.parse(data)
        out.append(cls * 100 + tag)
        if method:
            _walk(content, out)
        data = data[len(header) + len(content) + len(trailer):]

def operation(der):
    out = []
    _walk(der, out)
    return out
