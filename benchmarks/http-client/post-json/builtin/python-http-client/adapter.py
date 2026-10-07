import http.client, json

HEADERS = {'Content-Type': 'application/json'}

def connect(host, port):
    return http.client.HTTPConnection(host, port)

def operation(connection, value):
    connection.request('POST', value['path'], body=value['body'].encode(), headers=HEADERS)
    response = connection.getresponse()
    body = response.read()
    if response.status != 201:
        raise RuntimeError(f'status {response.status}')
    return json.loads(body)
