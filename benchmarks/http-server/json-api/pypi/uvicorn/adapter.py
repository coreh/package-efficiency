from typing import Any, Callable
import json
async def app(scope: dict[str, Any], receive: Callable[..., Any], send: Callable[..., Any]) -> None:
    path = scope['path']
    if path == '/':
        body, content_type = b'Hello, World!', b'text/plain'
    elif path.startswith('/users/'):
        user_id = int(path.rsplit('/', 1)[1])
        body, content_type = json.dumps({'id': user_id, 'name': f'User {user_id}'}).encode(), b'application/json'
    else:
        chunks = []
        while True:
            message = await receive()
            chunks.append(message.get('body', b''))
            if not message.get('more_body'): break
        body, content_type = json.dumps({'echo': json.loads(b''.join(chunks))}).encode(), b'application/json'
    await send({'type':'http.response.start','status':200,'headers':[(b'content-type',content_type),(b'content-length',str(len(body)).encode())]})
    await send({'type':'http.response.body','body':body})

def start() -> tuple[int, Callable[[], None]]:
    import threading, time, uvicorn
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=0, loop="asyncio", http="h11", lifespan="off", access_log=False, log_level="critical"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.monotonic() + 20
    while not server.started:
        if not thread.is_alive() or time.monotonic() > deadline: raise RuntimeError("Uvicorn failed to start")
        time.sleep(.005)
    port = server.servers[0].sockets[0].getsockname()[1]
    def close() -> None:
        server.should_exit = True
        thread.join(10)
        if thread.is_alive(): raise RuntimeError("Uvicorn failed to stop")
    return port, close
