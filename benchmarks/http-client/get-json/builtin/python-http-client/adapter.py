import http.client, json

def connect(host, port):
    return http.client.HTTPConnection(host, port)

def operation(connection, value):
    connection.request('GET', value['path'])
    response = connection.getresponse()
    body = response.read()
    if response.status != 200:
        raise RuntimeError(f'status {response.status}')
    return json.loads(body)
