import httpx2

def connect(host, port):
    return httpx2.Client(base_url=f'http://{host}:{port}')

def operation(client, value):
    response = client.get(value['path'])
    response.raise_for_status()
    return response.json()
