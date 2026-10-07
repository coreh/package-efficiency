import httptools

class Collector:
    def __init__(self):
        self.url = b''
        self.headers = []
    def on_url(self, url):
        self.url += url
    def on_header(self, name, value):
        self.headers.append((name, value))
    def on_headers_complete(self):
        pass

def prepare(input):
    return input.encode('latin-1')

def operation(data):
    p = Collector()
    parser = httptools.HttpRequestParser(p)
    try:
        parser.feed_data(data)
    except httptools.HttpParserUpgrade:
        pass
    return (parser.get_method(), p.url, parser.get_http_version(), p.headers)

def describe(r):
    method, url, version, headers = r
    return {
        'method': method.decode('latin-1'),
        'path': url.decode('latin-1'),
        'minor': int(version.split('.')[1]),
        'headers': [[n.decode('latin-1'), v.decode('latin-1')] for n, v in headers],
    }
