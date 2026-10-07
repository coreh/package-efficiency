import urllib3

def connect(host, port):
    return urllib3.HTTPConnectionPool(host, port, maxsize=1, retries=False)

def operation(pool, value):
    response = pool.request('GET', value['path'])
    if response.status != 200:
        raise RuntimeError(f'status {response.status}')
    return response.json()
