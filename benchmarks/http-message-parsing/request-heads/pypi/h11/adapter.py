import h11

def prepare(input):
    return input.encode('latin-1')

def operation(data):
    conn = h11.Connection(h11.SERVER)
    conn.receive_data(data)
    return conn.next_event()

def describe(event):
    return {
        'method': event.method.decode('latin-1'),
        'path': event.target.decode('latin-1'),
        'minor': int(event.http_version.split(b'.')[1]),
        'headers': [[n.decode('latin-1'), v.decode('latin-1')] for n, v in event.headers.raw_items()],
    }
