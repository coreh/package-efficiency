import json
import httpcore2

HEADERS = [(b'Content-Type', b'application/json')]

def connect(host, port):
    return httpcore2.ConnectionPool(max_connections=1), f'http://{host}:{port}'

def operation(state, value):
    pool, origin = state
    response = pool.request('POST', origin + value['path'], headers=HEADERS, content=value['body'].encode())
    if response.status != 201:
        raise RuntimeError(f'status {response.status}')
    return json.loads(response.content)
