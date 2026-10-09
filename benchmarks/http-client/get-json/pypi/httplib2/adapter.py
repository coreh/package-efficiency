import json
import httplib2

def connect(host, port):
    return httplib2.Http(), f'http://{host}:{port}'

def operation(state, value):
    http, origin = state
    response, body = http.request(origin + value['path'], 'GET')
    if response.status != 200:
        raise RuntimeError(f'status {response.status}')
    return json.loads(body)
