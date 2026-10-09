from curl_cffi import requests

HEADERS = {'Content-Type': 'application/json'}

def connect(host, port):
    return requests.Session(), f'http://{host}:{port}'

def operation(state, value):
    session, origin = state
    response = session.post(origin + value['path'], data=value['body'].encode(), headers=HEADERS)
    response.raise_for_status()
    return response.json()
