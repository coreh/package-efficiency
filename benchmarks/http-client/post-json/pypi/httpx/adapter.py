import httpx

HEADERS = {'Content-Type': 'application/json'}

def connect(host, port):
    return httpx.Client(base_url=f'http://{host}:{port}')

def operation(client, value):
    response = client.post(value['path'], content=value['body'].encode(), headers=HEADERS)
    response.raise_for_status()
    return response.json()
