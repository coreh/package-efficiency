from curl_cffi import requests

def connect(host, port):
    return requests.Session(), f'http://{host}:{port}'

def operation(state, value):
    session, origin = state
    response = session.get(origin + value['path'])
    response.raise_for_status()
    return response.json()
