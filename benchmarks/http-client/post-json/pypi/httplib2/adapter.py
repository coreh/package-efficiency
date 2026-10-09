import json
import httplib2

HEADERS = {'Content-Type': 'application/json'}

def connect(host, port):
    return httplib2.Http(), f'http://{host}:{port}'

def operation(state, value):
    http, origin = state
    response, body = http.request(origin + value['path'], 'POST', body=value['body'].encode(), headers=HEADERS)
    if response.status != 201:
        raise RuntimeError(f'status {response.status}')
    return json.loads(body)
