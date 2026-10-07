import requests

def connect(host, port):
    session = requests.Session()
    return session, f'http://{host}:{port}'

def operation(state, value):
    session, origin = state
    response = session.get(origin + value['path'])
    response.raise_for_status()
    return response.json()
