from typing import Callable
from starlette.requests import Request
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse, JSONResponse
from starlette.routing import Route
async def home(request: Request) -> PlainTextResponse:
    return PlainTextResponse('Hello, World!')
async def user(request: Request) -> JSONResponse:
    user_id = int(request.path_params['id'])
    return JSONResponse({'id':user_id, 'name':f'User {user_id}'})
async def echo(request: Request) -> JSONResponse:
    return JSONResponse({'echo':await request.json()})
app = Starlette(routes=[Route('/',home),Route('/users/{id}',user),Route('/echo',echo,methods=['POST'])])

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
