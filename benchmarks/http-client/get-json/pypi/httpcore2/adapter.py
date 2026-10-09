import json
import httpcore2

def connect(host, port):
    return httpcore2.ConnectionPool(max_connections=1), f'http://{host}:{port}'

def operation(state, value):
    pool, origin = state
    response = pool.request('GET', origin + value['path'])
    if response.status != 200:
        raise RuntimeError(f'status {response.status}')
    return json.loads(response.content)
