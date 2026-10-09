import redis

def connect(host, port):
    return redis.Redis(host=host, port=port, decode_responses=True)

def operation(client, input):
    if input['command'] == 'SET':
        return 'OK' if client.set(input['key'], input['value']) else None
    return client.get(input['key'])
